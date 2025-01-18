/**
 * Accessibility Testing Setup
 * Last Updated: 2025-03-19
 * 
 * Configures Jest and Testing Library for accessibility testing
 * with Axe-core integration.
 */

import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'
import { configureAxe } from 'jest-axe'

// Configure longer timeout for accessibility tests
jest.setTimeout(10000)

// Configure Testing Library
configure({
  // Ensure ARIA roles are checked
  computedStyleSupportsPseudoElements: true,
  // Add custom queries
  defaultHidden: true,
})

// Configure Axe
export const axe = configureAxe({
  rules: {
    // Ensure WCAG 2.1 AA compliance
    'color-contrast': { enabled: true },
    'frame-title': { enabled: true },
    'html-has-lang': { enabled: true },
    'landmark-one-main': { enabled: true },
    'page-has-heading-one': { enabled: true },
    'region': { enabled: true },
  },
  // Add WCAG 2.1 AA tags
  tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
})

// Custom matchers
expect.extend({
  toHaveNoViolations: async (received, axeRules = {}) => {
    const { violations } = await axe.run(received, { rules: axeRules })
    
    if (violations.length === 0) {
      return {
        pass: true,
        message: () => 'Expected the HTML to have accessibility violations',
      }
    }
    
    return {
      pass: false,
      message: () =>
        violations
          .map(violation => {
            const nodes = violation.nodes
              .map(node => node.html)
              .join('\n')
            
            return `${violation.help} (${violation.id})
              Description: ${violation.description}
              Impact: ${violation.impact}
              Affected nodes:\n${nodes}`
          })
          .join('\n\n'),
    }
  },
})

// Helper functions
export const getByRole = (container: HTMLElement, role: string, options = {}) => {
  return container.querySelector(`[role="${role}"]`)
}

export const getAllByRole = (container: HTMLElement, role: string) => {
  return Array.from(container.querySelectorAll(`[role="${role}"]`))
}

export const queryByRole = (container: HTMLElement, role: string) => {
  return container.querySelector(`[role="${role}"]`) || null
}

// Types
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): Promise<R>
    }
  }
} 