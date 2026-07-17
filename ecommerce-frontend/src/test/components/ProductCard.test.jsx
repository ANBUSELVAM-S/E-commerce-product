import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ProductCard from '../../components/ProductCard';

// Mock the CartContext
const mockAddToCart = vi.fn();
vi.mock('../../context/CartContext', () => ({
  useCart: () => ({
    addToCart: mockAddToCart,
  }),
}));

const mockProduct = {
  productId: 'prod-001',
  name: 'Wireless Headphones',
  price: 49.99,
  stock: 10,
  imageUrl: 'https://example.com/headphones.jpg',
};

const renderProductCard = (product = mockProduct) => {
  return render(
    <BrowserRouter>
      <ProductCard product={product} />
    </BrowserRouter>
  );
};

describe('ProductCard', () => {
  beforeEach(() => {
    mockAddToCart.mockClear();
  });

  it('renders product name', () => {
    renderProductCard();
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
  });

  it('renders product price formatted to 2 decimal places', () => {
    renderProductCard();
    expect(screen.getByText('$49.99')).toBeInTheDocument();
  });

  it('renders product image with correct src and alt', () => {
    renderProductCard();
    const img = screen.getByAltText('Wireless Headphones');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/headphones.jpg');
  });

  it('renders "Add to Cart" button when product is in stock', () => {
    renderProductCard();
    const button = screen.getByText('Add to Cart');
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('renders "Out of Stock" button and disables it when stock is 0', () => {
    renderProductCard({ ...mockProduct, stock: 0 });
    const button = screen.getByText('Out of Stock');
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('calls addToCart when "Add to Cart" button is clicked', async () => {
    const user = userEvent.setup();
    renderProductCard();

    const button = screen.getByText('Add to Cart');
    await user.click(button);

    expect(mockAddToCart).toHaveBeenCalledTimes(1);
    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct);
  });

  it('renders a link to the product details page', () => {
    renderProductCard();
    const links = screen.getAllByRole('link');
    const productLink = links.find(link => link.getAttribute('href')?.includes('/products/prod-001'));
    expect(productLink).toBeTruthy();
  });

  it('renders five star icons', () => {
    const { container } = renderProductCard();
    const stars = container.querySelectorAll('.stars i');
    expect(stars.length).toBe(5);
  });
});
