import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import config from '../config/config';
import '../styles/MyProducts.css';

function MyProducts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyProducts();
  }, [user, navigate]);

  const fetchMyProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(config.getApiUrl('/api/marketplace/my-products'), {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching my products:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(config.getApiUrl(`/api/marketplace/products/${productId}`), {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setProducts(prev => prev.filter(product => product._id !== productId));
        alert(' Product deleted successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(' Error: ' + error.message);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="my-products-container">
        <div className="loading">📦 Loading your products...</div>
      </div>
    );
  }

  return (
    <div className="my-products-container">
      <div className="my-products-header">
        <h1> My Product Listings</h1>
        <p>Manage your products and track their performance</p>
        <Link to="/marketplace/sell" className="add-product-btn">
          ➕ Add New Product
        </Link>
      </div>

      {error && (
        <div className="error-message">
           {error}
          <button onClick={fetchMyProducts} className="retry-btn">Try Again</button>
        </div>
      )}

      {products.length === 0 ? (
        <div className="no-products">
          <h3> No products listed yet</h3>
          <p>Start selling by listing your first product!</p>
          <Link to="/marketplace/sell" className="add-product-btn">
             List Your First Product
          </Link>
        </div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <div key={product._id} className="my-product-card">
              <div className="product-image">
                <img 
                  src={config.getAssetUrl(product.images[0])}
                  alt={product.title}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                  }}
                />
                <div className="product-status">
                  <span className={`status-badge ${product.availability.toLowerCase()}`}>
                    {product.availability === 'Available' ? '' : 
                     product.availability === 'Sold' ? '' : ''} 
                    {product.availability}
                  </span>
                </div>
              </div>

              <div className="product-info">
                <h3 className="product-title">{product.title}</h3>
                
                <div className="product-price">
                  {formatPrice(product.price)}
                  {product.unit !== 'piece' && (
                    <span className="price-unit">/{product.unit}</span>
                  )}
                </div>

                <div className="product-stats">
                  <span className="stat"> {product.views || 0} views</span>
                  <span className="stat"> {product.likes?.length || 0} likes</span>
                  <span className="stat"> {formatDate(product.createdAt)}</span>
                </div>

                <div className="product-actions">
                  <Link 
                    to={`/marketplace/product/${product._id}`}
                    className="view-btn"
                  >
                     View
                  </Link>
                  <Link 
                    to={`/marketplace/edit/${product._id}`}
                    className="edit-btn"
                  >
                     Edit
                  </Link>
                  <button 
                    onClick={() => handleDeleteProduct(product._id)}
                    className="delete-btn"
                  >
                     Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyProducts;
