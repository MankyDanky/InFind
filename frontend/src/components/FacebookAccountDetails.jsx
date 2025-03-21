import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/ChannelDetails.css';

const FacebookAccountDetails = () => {
  const { accountName } = useParams();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();

  // Define fallback image at component level
  const fallbackImage = 'https://placehold.co/200x200/3b5998/white?text=FB';

  useEffect(() => {
    const fetchAccountDetails = async () => {
      try {
        setLoading(true);
        // Use the proxied API path instead of direct URL
        const response = await fetch(`/api/facebook/account/${encodeURIComponent(accountName)}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.error || `Error fetching account: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Facebook account data:', data);
        setAccount(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching account details:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchAccountDetails();
  }, [accountName]);

  const handleBack = () => {
    navigate(-1);
  };

  // Format statistics for display
  const formatMetric = (value) => {
    if (!value || value === 'N/A') return 'N/A';
    
    // If the value is already formatted with K/M/B, return it as is
    if (typeof value === 'string' && /^\d+(\.\d+)?[KMB]$/.test(value)) {
      return value;
    }
    
    // Convert to number if it's a string
    const num = typeof value === 'number' ? value : parseInt(value.replace(/,/g, ''), 10);
    if (isNaN(num)) return value;
    
    // Format large numbers with K/M/B
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  // Handle image error
  const handleImageError = () => {
    console.log('Image failed to load, using fallback image');
    setImgError(true);
  };

  if (loading) {
    return (
      <div className="channel-details loading">
        <div className="back-button" onClick={handleBack}>
          &larr; Back
        </div>
        <div className="loading-spinner">
          Loading<span className="loading-dots"></span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="channel-details error">
        <div className="back-button" onClick={handleBack}>
          &larr; Back
        </div>
        <div className="error-message">
          <h2>Account Error</h2>
          <p>{error}</p>
          
          <div className="error-help">
            <p>This could be due to:</p>
            <ul>
              <li>The Facebook page may have been deleted or suspended</li>
              <li>You may need to refresh the search page and try again</li>
              <li>There might be a temporary issue with the Facebook API</li>
            </ul>
            <button onClick={handleBack} className="error-action-button">
              Go Back to Search
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="channel-details error">
        <div className="back-button" onClick={handleBack}>
          &larr; Back
        </div>
        <div className="error-message">
          <h2>Account Not Found</h2>
          <p>We couldn't find details for this Facebook account.</p>
        </div>
      </div>
    );
  }

  // Extract profile image from the URL if available
  // For demonstration, we'll use a placeholder with Facebook blue
  const profileImageUrl = account.profileImage || 
    `https://graph.facebook.com/${accountName}/picture?type=large` || 
    fallbackImage;

  // Use the thumbnail or fallback image if there's an error
  const thumbnailUrl = imgError ? fallbackImage : profileImageUrl;

  return (
    <div className="channel-details">
      <div className="back-button" onClick={handleBack}>
        &larr; Back
      </div>
      
      <div className="channel-header">
        <div className="channel-avatar">
          <img 
            src={thumbnailUrl} 
            alt={account.name} 
            onError={handleImageError} 
          />
        </div>
        <div className="channel-title">
          <h1>{account.name}</h1>
          <div className="channel-meta">
            <span className="followers">{formatMetric(account.followers)} followers</span>
            <span className="likes">{formatMetric(account.likes)} likes</span>
            {account.engagementRate && (
              <span className="engagement">{account.engagementRate} engagement</span>
            )}
          </div>
          <div className="channel-links">
            <a href={account.url} target="_blank" rel="noopener noreferrer" className="facebook-link">
              View on Facebook
            </a>
          </div>
          {account.verified && (
            <div className="verified-badge">
              <i className="fas fa-check-circle"></i> Verified Account
            </div>
          )}
        </div>
      </div>
      
      <div className="channel-content">
        <div className="channel-about">
          <h2>About</h2>
          <p className="description">{account.description || 'No description available.'}</p>
          
          <div className="channel-stats">
            <div className="stat-item">
              <div className="stat-value">{formatMetric(account.followers)}</div>
              <div className="stat-label">Followers</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{formatMetric(account.likes)}</div>
              <div className="stat-label">Likes</div>
            </div>
            {account.engagementRate && (
              <div className="stat-item">
                <div className="stat-value">{account.engagementRate}</div>
                <div className="stat-label">Engagement Rate</div>
              </div>
            )}
          </div>
          
          <div className="channel-metadata">
            {account.pageCreated && (
              <div className="metadata-item">
                <strong>Created:</strong> {account.pageCreated}
              </div>
            )}
            {account.location && (
              <div className="metadata-item">
                <strong>Location:</strong> {account.location}
              </div>
            )}
            {account.postFrequency && (
              <div className="metadata-item">
                <strong>Post Frequency:</strong> {account.postFrequency}
              </div>
            )}
            {account.contentFocus && (
              <div className="metadata-item">
                <strong>Content Focus:</strong> {account.contentFocus}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacebookAccountDetails; 