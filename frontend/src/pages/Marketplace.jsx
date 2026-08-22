import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiBox, FiEye, FiHeart, FiMapPin, FiPlus, FiSearch, FiShoppingBag, FiSliders, FiTag, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import config from '../config/config';
import '../styles/Marketplace.css';

function Marketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: 'All',
    search: '',
    minPrice: '',
    maxPrice: '',
    condition: 'All',
    location: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  const categories = [
    'All', 'Seeds', 'Fertilizers', 'Tools', 'Organic Products',
    'Pesticides', 'Equipment', 'Fruits', 'Vegetables', 
    'Grains', 'Dairy', 'Other'
  ];

  const conditions = ['All', 'New', 'Used', 'Refurbished'];

  // Filters and pagination are the intended marketplace query triggers.
  useEffect(() => {
    fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        category: filters.category !== 'All' ? filters.category : '',
        search: filters.search,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        condition: filters.condition !== 'All' ? filters.condition : '',
        location: filters.location,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      // Remove empty parameters
      for (let [key, value] of [...params]) {
        if (!value) {
          params.delete(key);
        }
      }

      const response = await fetch(config.getApiUrl(`/api/marketplace/products?${params}`), {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data);
        setPagination(prev => ({ 
          ...prev, 
          total: data.pagination.total,
          pages: data.pagination.pages
        }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchProducts();
  };

  const clearFilters = () => {
    setFilters({
      category: 'All',
      search: '',
      minPrice: '',
      maxPrice: '',
      condition: 'All',
      location: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleLikeProduct = async (productId, e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(config.getApiUrl(`/api/marketplace/products/${productId}/like`), {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        setProducts(prev => prev.map(product => 
          product._id === productId 
            ? {
                ...product,
                likes: { length: result.data.likes },
                hasLiked: result.data.hasLiked
              }
            : product
        ));
      }
    } catch (error) {
      console.error('Error liking product:', error);
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

  if (loading && products.length === 0) {
    return (
      <div className="marketplace-container page-shell">
        <div className="loading-state"><div><div className="spinner" /><p>Preparing the marketplace…</p></div></div>
      </div>
    );
  }

  return (
    <div className="marketplace-container page-shell">
      <header className="marketplace-header">
        <div>
          <span className="eyebrow">Farmer-to-farmer commerce</span>
          <h1>Agri marketplace</h1>
          <p>Discover farm inputs, equipment and produce from trusted people in the agricultural community.</p>
        </div>
        <div className="header-actions">
            {user && (
              <>
                <Link to="/marketplace/my-products" className="button button-secondary"><FiBox /> My listings</Link>
                <Link to="/marketplace/sell" className="button button-primary"><FiPlus /> List a product</Link>
              </>
            )}
            {!user && (
              <Link to="/login" className="button button-primary">Login to start selling <FiArrowRight /></Link>
            )}
        </div>
      </header>

      <div className="marketplace-filters">
        <form onSubmit={handleSearch} className="market-search">
          <FiSearch />
          <input type="search" placeholder="Search seeds, tools, produce…" value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} />
          <button type="submit" className="search-btn">Search</button>
        </form>
        <div className="filter-label"><FiSliders /> Refine results</div>
        <div className="filter-grid">
          <select 
            value={filters.category} 
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="filter-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All categories' : cat}
              </option>
            ))}
          </select>

          <select 
            value={filters.condition}
            onChange={(e) => handleFilterChange('condition', e.target.value)}
            className="filter-select"
          >
            {conditions.map(condition => (
              <option key={condition} value={condition}>
                {condition === 'All' ? 'All conditions' : condition}
              </option>
            ))}
          </select>

          <select 
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              setFilters(prev => ({ ...prev, sortBy, sortOrder }));
            }}
            className="filter-select"
          >
            <option value="createdAt-desc">Latest first</option>
            <option value="createdAt-asc">Oldest first</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="views-desc">Most viewed</option>
            <option value="likes-desc">Most liked</option>
          </select>

          <input
            type="text"
            placeholder="City or state"
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="location-input"
          />

          <div className="price-range" aria-label="Price range">
            <input
              type="number"
              placeholder="Min ₹"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="price-input"
            />
            <span>to</span>
            <input
              type="number"
              placeholder="Max ₹"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="price-input"
            />
          </div>
          <button type="button" onClick={clearFilters} className="clear-filters-btn">Reset</button>
        </div>
      </div>

      {/* Search Results Info */}
      {(filters.search || filters.category !== 'All' || filters.condition !== 'All' || filters.location || filters.minPrice || filters.maxPrice) && (
        <div className="search-info">
          <p><strong>{pagination.total}</strong> products found
            {filters.search && ` for "${filters.search}"`}
            {filters.category !== 'All' && ` in ${filters.category}`}
          </p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={fetchProducts} className="retry-btn">Try Again</button>
        </div>
      )}

      <div className="results-heading"><div><span className="eyebrow">Browse listings</span><h2>{filters.category === 'All' ? 'Fresh from the community' : filters.category}</h2></div><span>{pagination.total} listings</span></div>
      <div className="products-grid">
        {products.length === 0 && !loading ? (
          <div className="empty-state">
            <FiShoppingBag />
            <h3>No matching products</h3>
            <p>
              {filters.search || filters.category !== 'All' 
                ? 'Try adjusting your filters or search terms.' 
                : 'Be the first to list a product!'
              }
            </p>
            {user && (
              <Link to="/marketplace/sell" className="button button-primary"><FiPlus /> List your first product</Link>
            )}
          </div>
        ) : (
          products.map(product => (
            <div key={product._id} className="product-card">
              <Link to={`/marketplace/product/${product._id}`} className="product-link">
                <div className="product-image">
                  <img 
                    src={config.getAssetUrl(product.images[0])}
                    alt={product.title}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                    }}
                  />
                  <div className="product-badges">
                    {product.featured && <span className="featured-badge">Featured</span>}
                    <span className="condition-badge">{product.condition}</span>
                  </div>
                </div>

                <div className="product-info">
                  <div className="product-category">
                    <FiTag /> {product.category}
                  </div>
                  
                  <h3 className="product-title">{product.title}</h3>
                  
                  <div className="product-price">
                    {formatPrice(product.price)}
                    {product.unit !== 'piece' && (
                      <span className="price-unit">/{product.unit}</span>
                    )}
                  </div>

                  <div className="product-description">
                    {product.description.substring(0, 100)}
                    {product.description.length > 100 && '...'}
                  </div>

                  <div className="product-location">
                    <FiMapPin /> {product.location.city}, {product.location.state}
                  </div>

                  <div className="product-seller">
                    <FiUser /> {product.seller.name}
                    {product.seller.isVerified && <span className="verified-badge">Verified</span>}
                  </div>

                  <div className="product-availability">
                    <span className={`availability-badge ${product.availability.toLowerCase()}`}>
                      {product.availability}
                    </span>
                    {product.quantity > 1 && (
                      <span className="quantity"> {product.quantity} {product.unit}s available</span>
                    )}
                  </div>
                </div>
              </Link>

              <div className="product-actions">
                <button 
                  className={`like-btn ${product.hasLiked ? 'liked' : ''}`}
                  onClick={(e) => handleLikeProduct(product._id, e)}
                  disabled={!user}
                >
                  <FiHeart /> {product.likes?.length || 0}
                </button>
                <span className="product-card-meta"><FiEye /> {product.views || 0} · {formatDate(product.createdAt)}</span>
                <Link 
                  to={`/marketplace/product/${product._id}`} 
                  className="view-details-btn"
                >
                  View <FiArrowRight />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1 || loading}
            className="page-btn"
          >
            ← Previous
          </button>
          
          <span className="page-info">
            Page {pagination.page} of {pagination.pages} ({pagination.total} products)
          </span>
          
          <button 
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.pages || loading}
            className="page-btn"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default Marketplace;
