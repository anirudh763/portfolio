import { AccessibilityNodeInfo, AuditIssue } from './types';

export function runAccessibilityAudit(node: AccessibilityNodeInfo): AuditIssue[] {
  const issues: AuditIssue[] = [];
  
  function traverse(currentNode: AccessibilityNodeInfo, depth: number) {
    // Check Touch Target Size (WCAG 2.2 AAA requires 44x44 minimum, but 24x24 is minimum for Level AA exception)
    if (currentNode.isClickable) {
      const width = currentNode.boundsInScreen.right - currentNode.boundsInScreen.left;
      const height = currentNode.boundsInScreen.bottom - currentNode.boundsInScreen.top;
      
      if (width < 24 || height < 24) {
        issues.push({
          id: `tt-min-${currentNode.id}`,
          nodeId: currentNode.id,
          type: 'TOUCH_TARGET_SIZE',
          message: `Touch target size is ${width}x${height}px, which is below the 24x24px minimum.`,
          bounds: currentNode.boundsInScreen,
          severity: 'CRITICAL'
        });
      } else if (width < 44 || height < 44) {
        issues.push({
          id: `tt-aaa-${currentNode.id}`,
          nodeId: currentNode.id,
          type: 'TOUCH_TARGET_SIZE',
          message: `Touch target size is ${width}x${height}px, which doesn't meet the WCAG AAA 44x44px target.`,
          bounds: currentNode.boundsInScreen,
          severity: 'MODERATE'
        });
      }
      
      // Check Missing Labels for Interactive Elements
      if (!currentNode.text && !currentNode.contentDescription) {
        issues.push({
          id: `missing-label-${currentNode.id}`,
          nodeId: currentNode.id,
          type: 'MISSING_LABEL',
          message: 'Interactive element missing accessible name (text or contentDescription).',
          bounds: currentNode.boundsInScreen,
          severity: 'CRITICAL'
        });
      }
    }

    // Identify nested focus traps
    // If a node is focusable and contains a focusable child, it represents a potentially confusing paradigm in screen readers
    if (currentNode.isFocusable && currentNode.children.some(c => c.isFocusable)) {
      issues.push({
        id: `nested-focus-${currentNode.id}`,
        nodeId: currentNode.id,
        type: 'NESTED_FOCUS',
        message: 'Focusable element contains other focusable elements, potentially creating a nested focus trap.',
        bounds: currentNode.boundsInScreen,
        severity: 'SERIOUS'
      });
    }

    for (const child of currentNode.children) {
      traverse(child, depth + 1);
    }
  }

  traverse(node, 0);
  return issues;
}
