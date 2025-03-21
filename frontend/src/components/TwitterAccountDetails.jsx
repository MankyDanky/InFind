import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/ChannelDetails.css';

const TwitterAccountDetails = () => {
  const { username } = useParams();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();

  // Define fallback image at component level
  const fallbackImage = 'https://placehold.co/200x200/1DA1F2/white?text=@';

  useEffect(() => {
    const fetchAccountDetails = async () => {
      try {
        setLoading(true);
        // Use the proxied API path instead of direct URL
        const response = await fetch(`/api/twitter/account/${encodeURIComponent(username)}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.error || `Error fetching Twitter account: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Twitter account data:', data);
        setAccount(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching Twitter account details:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchAccountDetails();
  }, [username]);

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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    // If it's just a year, return it as is
    if (/^\d{4}$/.test(dateString)) return dateString;
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // If invalid date, return original
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  // Handle image error function
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
        <div className="loading-spinner">Loading...</div>
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
              <li>The Twitter account may have been deleted or suspended</li>
              <li>You may need to refresh the search page and try again</li>
              <li>There might be a temporary issue with the Twitter API</li>
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
          <p>We couldn't find details for this Twitter account.</p>
        </div>
      </div>
    );
  }

  // Use profile image or fallback
  const profileImageUrl = account.profileImage || fallbackImage;

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
          <div className="twitter-username">@{account.username}</div>
          <div className="channel-meta">
            <span className="followers">{formatMetric(account.followers)} followers</span>
            <span className="following">{formatMetric(account.following)} following</span>
            <span className="tweets">{formatMetric(account.tweets)} tweets</span>
          </div>
          <div className="channel-links">
            <a href={account.url} target="_blank" rel="noopener noreferrer" className="twitter-link">
              View on Twitter
            </a>
          </div>
          {account.verified && (
            <div className="verified-badge twitter-verified">
              <i className="fas fa-check-circle"></i> Verified Account
            </div>
          )}
          {account.dataSource && (
            <div className="data-source-note">
              Note: {account.dataSource}
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
              <div className="stat-value">{formatMetric(account.following)}</div>
              <div className="stat-label">Following</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{formatMetric(account.tweets)}</div>
              <div className="stat-label">Tweets</div>
            </div>
          </div>
          
          <div className="channel-metadata">
            {account.created && (
              <div className="metadata-item">
                <strong>Joined:</strong> {formatDate(account.created)}
              </div>
            )}
            {account.location && (
              <div className="metadata-item">
                <strong>Location:</strong> {account.location}
              </div>
            )}
            {account.postFrequency && (
              <div className="metadata-item">
                <strong>Tweet Frequency:</strong> {account.postFrequency}
              </div>
            )}
            {account.contentFocus && (
              <div className="metadata-item">
                <strong>Content Focus:</strong> {account.contentFocus}
              </div>
            )}
            {account.engagement && (
              <div className="metadata-item">
                <strong>Engagement Rate:</strong> {account.engagement}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwitterAccountDetails; 