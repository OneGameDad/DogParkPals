import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import '../i18n';

describe('App', () => {
    it('should render the application', async () => {
        render(<App />);

        await waitFor(() => {
            const homeLink = screen.getByRole('link', { name: /Home/i });
            expect(homeLink).toBeInTheDocument();
        });
    });
});
