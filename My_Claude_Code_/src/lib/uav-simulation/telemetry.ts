import { UAVState, SecurityState, SpoofingAttackType } from './types';
import { addVectors } from './math';

export class MAVLinkDefender {
  private ekfStateEstimate: UAVState | null = null;
  private attackState: SecurityState = {
    underAttack: false,
    attackType: 'NONE',
    anomalyScore: 0,
    mitigationActive: false
  };

  // Threshold for Mahalanobis-like distance
  private anomalyThreshold = 5.0; 

  public spoofTelemetry(trueState: UAVState, attackMode: SpoofingAttackType): UAVState {
    const spoiled = JSON.parse(JSON.stringify(trueState)) as UAVState;
    
    switch (attackMode) {
      case 'GPS_DRIFT':
        // Accelerating drift in X/Y plane
        const driftAmount = (Date.now() % 10000) / 1000;
        spoiled.position.x += driftAmount;
        spoiled.position.y -= driftAmount;
        break;
      case 'GYRO_BIAS':
        // Constant bias on angular velocity
        spoiled.angularVelocity.x += 0.5;
        spoiled.angularVelocity.y -= 0.5;
        break;
      case 'ACTUATOR_DOS':
        // Actuator DoS affects control logic downstream, telemetry sees rapid altitude loss
        break;
      case 'NONE':
      default:
        break;
    }
    
    return spoiled;
  }

  public detectAnomalies(sensorData: UAVState, prediction: UAVState): SecurityState {
    // Simplified EKF innovation calculation (residuals)
    const posResidual = Math.sqrt(
      Math.pow(sensorData.position.x - prediction.position.x, 2) +
      Math.pow(sensorData.position.y - prediction.position.y, 2) +
      Math.pow(sensorData.position.z - prediction.position.z, 2)
    );

    const wResidual = Math.sqrt(
      Math.pow(sensorData.angularVelocity.x - prediction.angularVelocity.x, 2) +
      Math.pow(sensorData.angularVelocity.y - prediction.angularVelocity.y, 2) +
      Math.pow(sensorData.angularVelocity.z - prediction.angularVelocity.z, 2)
    );

    // Naive Mahalanobis distance proxy
    const anomalyScore = (posResidual * 2.0) + (wResidual * 10.0);

    if (anomalyScore > this.anomalyThreshold) {
      this.attackState = {
        underAttack: true,
        attackType: wResidual > posResidual ? 'GYRO_BIAS' : 'GPS_DRIFT',
        anomalyScore,
        mitigationActive: true // Failsafe triggered
      };
    } else {
      // Decay score
      this.attackState.anomalyScore = Math.max(0, this.attackState.anomalyScore - 0.1);
      if (this.attackState.anomalyScore < this.anomalyThreshold * 0.5) {
        this.attackState.underAttack = false;
        this.attackState.attackType = 'NONE';
        // Mitigation might stay active depending on policy, but we'll reset here for sim purposes
        this.attackState.mitigationActive = false; 
      }
    }

    return this.attackState;
  }
}
