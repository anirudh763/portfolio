export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface AccessibilityNodeInfo {
  id: string;
  className: string;
  contentDescription: string | null;
  text: string | null;
  boundsInScreen: BoundingBox;
  isClickable: boolean;
  isFocusable: boolean;
  isFocused: boolean;
  isCheckable: boolean;
  isChecked: boolean;
  isScrollable: boolean;
  children: AccessibilityNodeInfo[];
}

export interface AuditIssue {
  id: string;
  nodeId: string;
  type: string;
  message: string;
  bounds: BoundingBox;
  severity: 'CRITICAL' | 'SERIOUS' | 'MODERATE' | 'MINOR';
}
