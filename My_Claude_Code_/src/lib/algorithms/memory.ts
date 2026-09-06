export interface MemoryBlock {
  id: string;
  address: number;
  size: number;
  allocated: boolean;
}

export interface ContainerState {
  capacity: number;
  size: number;
  growthFactor: number;
  blocks: MemoryBlock[];
  fragmentationScore: number;
  reallocations: number;
}

export class MemorySim {
  private memorySize = 1024;
  private cacheLineSize = 64;
  
  public state: ContainerState = {
    capacity: 0,
    size: 0,
    growthFactor: 1.5,
    blocks: [],
    fragmentationScore: 0,
    reallocations: 0
  };
  
  constructor(growthFactor: number = 2.0) {
    this.state.growthFactor = growthFactor;
    this.initializeMemory();
  }
  
  private initializeMemory() {
    this.state.capacity = 4;
    this.state.size = 0;
    this.state.blocks = [{
      id: 'block-0',
      address: 0,
      size: this.state.capacity,
      allocated: true
    }];
  }
  
  public push() {
    if (this.state.size >= this.state.capacity) {
      this.reallocate();
    }
    this.state.size++;
  }
  
  private reallocate() {
    const oldCapacity = this.state.capacity;
    this.state.capacity = Math.max(
      oldCapacity + 1,
      Math.floor(oldCapacity * this.state.growthFactor)
    );
    
    // Simulate allocation in contiguous space, pushing old block to "freed" state
    const oldBlock = this.state.blocks.find(b => b.allocated);
    if (oldBlock) {
      oldBlock.allocated = false;
    }
    
    // Find next aligned address
    const lastAddress = oldBlock ? oldBlock.address + oldBlock.size : 0;
    // Align to cache line boundaries (mocking 8 bytes per element)
    const alignmentOverhead = (lastAddress * 8) % this.cacheLineSize;
    const padding = alignmentOverhead === 0 ? 0 : (this.cacheLineSize - alignmentOverhead) / 8;
    
    const newAddress = lastAddress + padding;
    
    this.state.blocks.push({
      id: `block-${this.state.reallocations + 1}`,
      address: newAddress,
      size: this.state.capacity,
      allocated: true
    });
    
    this.state.reallocations++;
    this.updateFragmentation();
  }
  
  private updateFragmentation() {
    // Ratio of unallocated memory space up to the highest address used
    let allocatedSpace = 0;
    let totalSpan = 0;
    
    if (this.state.blocks.length > 0) {
      const activeBlock = this.state.blocks.find(b => b.allocated);
      if (activeBlock) {
        allocatedSpace = activeBlock.size;
        totalSpan = activeBlock.address + activeBlock.size;
      }
    }
    
    if (totalSpan > 0) {
      this.state.fragmentationScore = 1 - (allocatedSpace / totalSpan);
    }
  }
}
