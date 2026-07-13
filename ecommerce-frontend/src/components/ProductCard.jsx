import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  return (
    <div className="dream-card">
      <Link to={`/products/${product._id || product.productId}`} className="text-decoration-none">
        <div className="img-wrapper position-relative">
          {product._id?.endsWith('1') && (
            <span className="position-absolute top-0 start-0 bg-dark text-white px-2 py-1 m-2" style={{ fontSize: '10px' }}>NEW</span>
          )}
          <img 
            src={product.imageUrl || `https://via.placeholder.com/300x400/f5f5f5/333333?text=${encodeURIComponent(product.name)}`} 
            alt={product.name} 
            className="img-fluid"
          />
        </div>
      </Link>
      
      {/* Black Stars */}
      <div className="stars">
        <i className="fas fa-star"></i>
        <i className="fas fa-star"></i>
        <i className="fas fa-star"></i>
        <i className="fas fa-star"></i>
        <i className="far fa-star"></i>
      </div>

      <Link to={`/products/${product._id || product.productId}`} className="dream-card-title d-block text-truncate">
        {product.name}
      </Link>
      
      {/* Assuming requested default USD, using $ */}
      <div className="dream-card-price">
        ${product.price.toFixed(2)}
      </div>

      <button 
        className="btn-add-cart" 
        onClick={() => addToCart(product)}
        disabled={product.stock <= 0}
      >
        {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
      </button>
    </div>
  );
};

export default ProductCard;
