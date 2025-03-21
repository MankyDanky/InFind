import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/ChannelDetails.css';

const ChannelDetails = () => {
  const { platform, channelName } = useParams();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [marketingAnalysis, setMarketingAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const navigate = useNavigate();

  // Define fallback image at component level
  const fallbackImage = 'https://placehold.co/200x200/gray/white?text=No+Image';

  useEffect(() => {
    // Only allow YouTube channels
    if (platform !== 'youtube') {
      setError('Only YouTube channels are supported for detailed view');
      setLoading(false);
      return;
    }

    const fetchChannelDetails = async () => {
      try {
        setLoading(true);
        // Use the proxied API path instead of direct URL
        const response = await fetch(`/api/youtube/channel/${encodeURIComponent(channelName)}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.error || `Error fetching channel: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('YouTube channel data:', data);
        setChannel(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching channel details:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchChannelDetails();
  }, [platform, channelName]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleGenerateAnalysis = async () => {
    if (!channel || !channel.id) {
      setAnalysisError('Channel ID not available for analysis');
      return;
    }

    try {
      setAnalysisLoading(true);
      setAnalysisError(null);

      const response = await fetch(`/api/youtube/channel/${channel.id}/marketing-analysis`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to generate marketing analysis');
      }
      
      const data = await response.json();
      console.log('Marketing analysis data:', data);
      setMarketingAnalysis(data);
    } catch (err) {
      console.error('Error generating marketing analysis:', err);
      setAnalysisError(err.message);
    } finally {
      setAnalysisLoading(false);
    }
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
          <h2>Channel Error</h2>
          <p>{error}</p>
          
          {error.includes('Channel ID') && (
            <div className="error-help">
              <p>This could be due to:</p>
              <ul>
                <li>The channel may have been deleted or suspended</li>
                <li>You may need to refresh the search page and try again</li>
                <li>There might be a temporary issue with the YouTube API</li>
              </ul>
              <button onClick={handleBack} className="error-action-button">
                Go Back to Search
              </button>
            </div>
          )}
          
          {error.includes('API') && (
            <div className="error-help">
              <p>There may be an issue with our connection to YouTube:</p>
              <ul>
                <li>YouTube API quota limits may have been reached</li>
                <li>The API key may need to be refreshed</li>
                <li>Try again later when the quota resets</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="channel-details error">
        <div className="back-button" onClick={handleBack}>
          &larr; Back
        </div>
        <div className="error-message">
          <h2>Channel Not Found</h2>
          <p>We couldn't find details for this channel.</p>
        </div>
      </div>
    );
  }

  // Handle YouTube specific URL
  let channelUrl = `https://youtube.com/channel/${channel.id}`;
  if (channel.customUrl) {
    channelUrl = `https://youtube.com/c/${channel.customUrl}`;
  }

  // Use thumbnail or fallback image if there's an error or no thumbnail
  const thumbnailUrl = imgError || !channel.thumbnail ? fallbackImage : channel.thumbnail;

  return (
    <div className="channel-details">
      <div className="back-button" onClick={handleBack}>
        &larr; Back
      </div>
      
      <div className="channel-header">
        <div className="channel-avatar">
          <img 
            src={thumbnailUrl} 
            alt={channel.name} 
            onError={handleImageError} 
          />
        </div>
        <div className="channel-title">
          <h1>{channel.name}</h1>
          <div className="channel-meta">
            <span className="subscribers">{formatMetric(channel.subscriberCount)} subscribers</span>
            <span className="videos">{formatMetric(channel.videoCount)} videos</span>
            <span className="views">{formatMetric(channel.viewCount)} total views</span>
          </div>
          <div className="channel-links">
            <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="youtube-link">
              View on YouTube
            </a>
            {!marketingAnalysis && (
              <button 
                className="analysis-button" 
                onClick={handleGenerateAnalysis}
                disabled={analysisLoading}
              >
                {analysisLoading ? 'Analyzing...' : 'Brand Partnership Analysis'}
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="channel-content">
        {(marketingAnalysis || analysisLoading || analysisError) && (
          <div className="marketing-analysis-section">
            <h2>Marketing Analysis for Brand Partnerships</h2>
            
            {analysisLoading && (
              <div className="loading-spinner analysis-loading">
                Analyzing...
              </div>
            )}
            
            {analysisError && (
              <div className="error-message analysis-error">
                <p>Error generating analysis: {analysisError}</p>
              </div>
            )}
            
            {marketingAnalysis && !analysisLoading && (
              <div className="analysis-content">
                <div className="analysis-text">
                  {(() => {
                    // Parse the text to extract different sections
                    const text = marketingAnalysis.analysisText;
                    
                    // Find the potential summary (first line usually)
                    const potentialMatch = text.match(/Partnership Potential:?[^\n]*/i) || 
                                          text.match(/^([^\n]*potential[^\n]*)/i);
                    const potentialSummary = potentialMatch ? potentialMatch[0] : '';
                    
                    // Better extraction of pros, cons, and best fit sections
                    // First split the entire text into sections by major headings
                    const sections = text.split(/(?=PROS:|CONS:|Best fit for:)/i);
                    
                    // Extract pros items - find the PROS section and extract numbered items
                    const prosSection = sections.find(section => section.trim().toUpperCase().startsWith('PROS:'));
                    const prosList = prosSection ? 
                      prosSection
                        .replace(/^PROS:/i, '')
                        .trim()
                        .split(/\s*\d+\.\s*/)
                        .filter(item => item.trim().length > 0) : 
                      [];
                    
                    // Extract cons items - find the CONS section and extract numbered items
                    const consSection = sections.find(section => section.trim().toUpperCase().startsWith('CONS:'));
                    const consList = consSection ? 
                      consSection
                        .replace(/^CONS:/i, '')
                        .trim()
                        .split(/\s*\d+\.\s*/)
                        .filter(item => item.trim().length > 0) : 
                      [];
                    
                    // Extract best fit items
                    const bestFitSection = sections.find(section => section.trim().toUpperCase().startsWith('BEST FIT FOR:'));
                    const bestFitItems = bestFitSection ?
                      bestFitSection
                        .replace(/^Best fit for:/i, '')
                        .trim()
                        .split(/\s*[•\-*]\s*|\s*\d+\.\s*/)
                        .filter(item => item.trim().length > 0) :
                      [];
                    
                    // Debugging
                    console.log("Parsed sections:", { 
                      summary: potentialSummary,
                      prosCount: prosList.length, 
                      consCount: consList.length,
                      bestFitCount: bestFitItems.length
                    });
                    
                    return (
                      <>
                        {potentialSummary && (
                          <div className="potential-summary">
                            <h3>{potentialSummary}</h3>
                          </div>
                        )}
                        
                        <div className="pros-cons-container">
                          <div className="pros-section">
                            <h3>PROS</h3>
                            <ul>
                              {prosList.length > 0 ? (
                                prosList.map((pro, i) => <li key={`pro-${i}`}>{pro.trim()}</li>)
                              ) : (
                                <li>No specific pros identified</li>
                              )}
                            </ul>
                          </div>
                          
                          <div className="cons-section">
                            <h3>CONS</h3>
                            <ul>
                              {consList.length > 0 ? (
                                consList.map((con, i) => <li key={`con-${i}`}>{con.trim()}</li>)
                              ) : (
                                <li>No specific cons identified</li>
                              )}
                            </ul>
                          </div>
                        </div>
                        
                        {bestFitItems.length > 0 && (
                          <div className="best-fit-section">
                            <h3>Best Fit For</h3>
                            <ul>
                              {bestFitItems.map((fit, i) => <li key={`fit-${i}`}>{fit.trim()}</li>)}
                            </ul>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="channel-about">
          <h2>About</h2>
          <p className="description">{channel.description || 'No description available.'}</p>
          
          <div className="channel-stats">
            <div className="stat-item">
              <div className="stat-value">{formatMetric(channel.subscriberCount)}</div>
              <div className="stat-label">Subscribers</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{formatMetric(channel.videoCount)}</div>
              <div className="stat-label">Videos</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{formatMetric(channel.viewCount)}</div>
              <div className="stat-label">Views</div>
            </div>
          </div>
          
          <div className="channel-metadata">
            <div className="metadata-item">
              <strong>Created:</strong> {new Date(channel.publishedAt).toLocaleDateString()}
            </div>
            {channel.country && (
              <div className="metadata-item">
                <strong>Country:</strong> {channel.country}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelDetails; 