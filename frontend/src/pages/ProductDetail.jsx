import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import config from '../config/config';
import '../styles/ProductDetail.css';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactInfo, setShowContactInfo] = useState(false);

  // Reload only when the selected product changes.
  useEffect(() => {
    fetchProduct();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(config.getApiUrl(`/api/marketplace/products/${id}`), {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setProduct(data.data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Product not found');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeProduct = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(config.getApiUrl(`/api/marketplace/products/${id}/like`), {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        setProduct(prev => ({
          ...prev,
          likes: Array.from({ length: result.data.likes }),
          hasLiked: result.data.hasLiked
        }));
      }
    } catch (error) {
      console.error('Error liking product:', error);
    }
  };

  const handleContactSeller = () => {
    setShowContactInfo(true);
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
      month: 'long',
      year: 'numeric'
    });
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  const handlePrint = () => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1>${product.title}</h1>
        <div style="display: flex; gap: 20px; margin: 20px 0;">
          <img src="${window.location.origin}${product.images[0]}" style="width: 300px; height: 200px; object-fit: cover;" />
          <div>
            <p><strong>Price:</strong> ${formatPrice(product.price)}</p>
            <p><strong>Category:</strong> ${product.category}</p>
            <p><strong>Condition:</strong> ${product.condition}</p>
            <p><strong>Location:</strong> ${product.location.city}, ${product.location.state}</p>
            <p><strong>Quantity:</strong> ${product.quantity} ${product.unit}</p>
          </div>
        </div>
        <h3>Description:</h3>
        <p>${product.description}</p>
        <h3>Seller Information:</h3>
        <p><strong>Name:</strong> ${product.seller.name}</p>
        ${showContactInfo && product.contactInfo ? `
          <p><strong>Phone:</strong> ${product.contactInfo.phone || 'N/A'}</p>
          <p><strong>Email:</strong> ${product.contactInfo.email || 'N/A'}</p>
        ` : ''}
        <p style="margin-top: 30px; font-size: 12px; color: #666;">Printed from AgriSathi Marketplace</p>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Seeds': '',
      'Fertilizers': '',
      'Tools': '',
      'Organic Products': '',
      'Pesticides': '',
      'Equipment': '',
      'Fruits': '',
      'Vegetables': '',
      'Grains': '',
      'Dairy': '',
      'Other': ''
    };
    return icons[category] || '';
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  if (loading) {
    return (
      <div className="product-detail-container">
        <div className="loading">🔄 Loading product details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-detail-container">
        <div className="error-state">
          <h2> {error}</h2>
          <div className="error-actions">
            <button onClick={() => navigate('/marketplace')} className="back-btn">
              ← Back to Marketplace
            </button>
            <button onClick={fetchProduct} className="retry-btn">
               Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-container">
        <div className="error-state">
          <h2> Product not found</h2>
          <button onClick={() => navigate('/marketplace')} className="back-btn">
            ← Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-container">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <Link to="/marketplace" className="breadcrumb-link">🛒 Marketplace</Link>
        <span className="breadcrumb-separator">›</span>
        <Link to={`/marketplace?category=${product.category}`} className="breadcrumb-link">
          {getCategoryIcon(product.category)} {product.category}
        </Link>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{product.title}</span>
      </div>

      <div className="product-detail-content">
        {/* Product Images */}
        <div className="product-images">
          <div className="main-image">
            <img 
              src={config.getAssetUrl(product.images[currentImageIndex])}
              alt={product.title}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/600x400?text=No+Image';
              }}
            />
            
            {product.images.length > 1 && (
              <>
                <button className="image-nav prev" onClick={prevImage}>
                  ‹
                </button>
                <button className="image-nav next" onClick={nextImage}>
                  ›
                </button>
                
                <div className="image-indicators">
                  {product.images.map((_, index) => (
                    <button
                      key={index}
                      className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Product Badges */}
            <div className="image-badges">
              {product.featured && (
                <span className="badge featured">⭐ Featured</span>
              )}
              <span className="badge condition">{product.condition}</span>
              <span className={`badge availability ${product.availability.toLowerCase()}`}>
                {product.availability === 'Available' ? '' : 
                 product.availability === 'Sold' ? '' : ''} 
                {product.availability}
              </span>
            </div>
          </div>

          {/* Thumbnail Images */}
          {product.images.length > 1 && (
            <div className="thumbnail-images">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img 
                    src={config.getAssetUrl(image)}
                    alt={`${product.title} ${index + 1}`}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/100x100?text=No+Image';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="product-info">
          <div className="product-header">
            <div className="category-badge">
              {getCategoryIcon(product.category)} {product.category}
            </div>
            <h1 className="product-title">{product.title}</h1>
            
            <div className="product-price">
              <span className="price">{formatPrice(product.price)}</span>
              {product.unit !== 'piece' && (
                <span className="unit">per {product.unit}</span>
              )}
            </div>
          </div>

          <div className="product-details">
            <div className="detail-section">
              <h3> Description</h3>
              <div className="description">
                {product.description.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <h3> Product Details</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="label">Condition:</span>
                  <span className="value"> {product.condition}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Quantity:</span>
                  <span className="value"> {product.quantity} {product.unit}{product.quantity > 1 ? 's' : ''}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Location:</span>
                  <span className="value"> {product.location.city}, {product.location.state}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Listed on:</span>
                  <span className="value"> {formatDate(product.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>👤 Seller Information</h3>
              <div className="seller-info">
                <div className="seller-details">
                  <div className="seller-name">
                    {product.seller.name}
                    {product.seller.isVerified && (
                      <span className="verified-badge">Verified</span>
                    )}
                  </div>
                  <div className="seller-stats">
                    <span className="stat"> {product.seller.totalProducts} Products</span>
                    <span className="stat"> Joined {formatDate(product.seller.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            {showContactInfo && product.contactInfo && (
              <div className="detail-section contact-section">
                <h3>📞 Contact Information</h3>
                <div className="contact-info">
                  {product.contactInfo.phone && (
                    <div className="contact-item">
                      <span className="contact-label"> Phone:</span>
                      <a href={`tel:${product.contactInfo.phone}`} className="contact-value">
                        {product.contactInfo.phone}
                      </a>
                    </div>
                  )}
                  {product.contactInfo.email && (
                    <div className="contact-item">
                      <span className="contact-label"> Email:</span>
                      <a href={`mailto:${product.contactInfo.email}`} className="contact-value">
                        {product.contactInfo.email}
                      </a>
                    </div>
                  )}
                  {product.contactInfo.whatsapp && (
                    <div className="contact-item">
                      <span className="contact-label"> WhatsApp:</span>
                      <a 
                        href={`https://wa.me/${product.contactInfo.whatsapp.replace(/[^\d]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="contact-value whatsapp"
                      >
                        {product.contactInfo.whatsapp}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="product-actions">
            <div className="action-row">
              <button 
                className={`like-btn ${product.hasLiked ? 'liked' : ''}`}
                onClick={handleLikeProduct}
                disabled={!user}
                title={!user ? 'Login to like' : product.hasLiked ? 'Remove like' : 'Like this product'}
              >
                 {product.hasLiked ? 'Liked' : 'Like'} ({product.likesCount || 0})
              </button>

              {user && user._id === product.seller._id ? (
                <Link to={`/marketplace/edit/${product._id}`} className="edit-btn">
                   Edit Product
                </Link>
              ) : (
                <>
                  {!showContactInfo ? (
                    <button 
                      className="contact-btn primary"
                      onClick={handleContactSeller}
                      disabled={!user}
                    >
                      {!user ? 'Login to Contact' : 'Contact Seller'}
                    </button>
                  ) : (
                    <button className="contact-btn contacted">
                       Contact Info Shown
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <button 
                className="quick-action"
                onClick={() => navigator.share && navigator.share({
                  title: product.title,
                  text: product.description,
                  url: window.location.href
                })}
              >
                 Share
              </button>
              
              <button 
                className="quick-action"
                onClick={handlePrint}
              >
                Print Details
              </button>
            </div>
          </div>

          {/* Product Stats */}
          <div className="product-stats">
            <div className="stat-item">
              <span className="stat-icon"></span>
              <span className="stat-value">{product.views || 0}</span>
              <span className="stat-label">Views</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon"></span>
              <span className="stat-value">{product.likesCount || 0}</span>
              <span className="stat-label">Likes</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon"></span>
              <span className="stat-value">{getTimeAgo(product.createdAt)}</span>
              <span className="stat-label">Listed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <div className="related-products">
          <h3>🔍 Related Products</h3>
          <div className="products-grid">
            {product.relatedProducts.map((relatedProduct) => (
              <Link 
                key={relatedProduct._id} 
                to={`/marketplace/product/${relatedProduct._id}`}
                className="related-product-card"
              >
                <img 
                  src={config.getAssetUrl(relatedProduct.images[0])}
                  alt={relatedProduct.title}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/200x150?text=No+Image';
                  }}
                />
                <div className="related-product-info">
                  <h4>{relatedProduct.title}</h4>
                  <p className="price">{formatPrice(relatedProduct.price)}</p>
                  <p className="location">📍 {relatedProduct.location.city}</p>
                  <p className="seller">👤 {relatedProduct.seller.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Seller's Other Products */}
      {product.sellerProducts && product.sellerProducts.length > 0 && (
        <div className="seller-products">
          <h3> More from {product.seller.name}</h3>
          <div className="products-grid">
            {product.sellerProducts.map((sellerProduct) => (
              <Link 
                key={sellerProduct._id} 
                to={`/marketplace/product/${sellerProduct._id}`}
                className="seller-product-card"
              >
                <img 
                  src={config.getAssetUrl(sellerProduct.images[0])}
                  alt={sellerProduct.title}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/200x150?text=No+Image';
                  }}
                />
                <div className="seller-product-info">
                  <h4>{sellerProduct.title}</h4>
                  <p className="price">{formatPrice(sellerProduct.price)}</p>
                  <p className="condition">✨ {sellerProduct.condition}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Browse More */}
      <div className="browse-more">
        <Link to={`/marketplace?category=${product.category}`} className="browse-link">
           Browse more {product.category}
        </Link>
      </div>
    </div>
  );
}

export default ProductDetail;
