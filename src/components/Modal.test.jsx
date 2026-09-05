import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from './Modal'

describe('Modal', () => {
    it('renders nothing when closed', () => {
        render(<Modal open={false} title="Stats" onClose={() => {}}>body</Modal>)
        expect(screen.queryByText('Stats')).not.toBeInTheDocument()
    })

    it('renders the title and children when open', () => {
        render(<Modal open title="Stats" onClose={() => {}}>body</Modal>)
        expect(screen.getByRole('heading', { name: 'Stats' })).toBeInTheDocument()
        expect(screen.getByText('body')).toBeInTheDocument()
    })

    it('closes on the close button and on the overlay, but not on the panel', async () => {
        const user = userEvent.setup()
        const onClose = vi.fn()
        const { container } = render(
            <Modal open title="Stats" onClose={onClose}>body</Modal>
        )

        await user.click(screen.getByRole('button', { name: 'Close' }))
        expect(onClose).toHaveBeenCalledTimes(1)

        await user.click(screen.getByText('body'))
        expect(onClose).toHaveBeenCalledTimes(1)

        await user.click(container.querySelector('.modal-overlay'))
        expect(onClose).toHaveBeenCalledTimes(2)
    })
})
