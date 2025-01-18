/**
 * Component Accessibility Tests
 * Last Updated: 2025-03-19
 * 
 * Tests components for WCAG 2.1 AA compliance using
 * Jest, Testing Library, and Axe.
 */

import { render, screen } from '@testing-library/react'
import { axe } from './setup'
import userEvent from '@testing-library/user-event'

// Import components to test
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'

describe('Accessibility Tests', () => {
  describe('Button Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Button>Click Me</Button>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
    
    it('should be keyboard accessible', async () => {
      render(<Button>Click Me</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveFocus()
      
      await userEvent.tab()
      expect(button).toHaveFocus()
      
      await userEvent.keyboard('{enter}')
      // Add assertions for button click
    })
    
    it('should have proper ARIA attributes when loading', () => {
      render(<Button isLoading>Loading</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button).toHaveAttribute('disabled')
    })
  })
  
  describe('Input Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Input 
          label="Email"
          type="email"
          required
          aria-describedby="email-hint"
        />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
    
    it('should have proper label association', () => {
      render(
        <Input 
          label="Email"
          type="email"
          required
        />
      )
      
      const input = screen.getByLabelText('Email')
      expect(input).toBeInTheDocument()
    })
    
    it('should indicate required state to screen readers', () => {
      render(
        <Input 
          label="Email"
          type="email"
          required
        />
      )
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-required', 'true')
    })
  })
  
  describe('Dialog Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Dialog 
          isOpen
          title="Test Dialog"
          onClose={() => {}}
        >
          Dialog Content
        </Dialog>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
    
    it('should trap focus when open', async () => {
      render(
        <Dialog 
          isOpen
          title="Test Dialog"
          onClose={() => {}}
        >
          <Button>Action</Button>
          <Button>Cancel</Button>
        </Dialog>
      )
      
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveFocus()
      
      await userEvent.tab()
      expect(screen.getByText('Action')).toHaveFocus()
      
      await userEvent.tab()
      expect(screen.getByText('Cancel')).toHaveFocus()
      
      await userEvent.tab()
      expect(screen.getByText('Action')).toHaveFocus() // Focus should wrap
    })
    
    it('should have proper ARIA attributes', () => {
      render(
        <Dialog 
          isOpen
          title="Test Dialog"
          onClose={() => {}}
        >
          Dialog Content
        </Dialog>
      )
      
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby')
      
      const title = screen.getByText('Test Dialog')
      expect(title).toHaveAttribute('id', dialog.getAttribute('aria-labelledby'))
    })
  })
}) 