import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import ChannelDetails from './components/ChannelDetails';
import ChannelCard from './components/ChannelCard';
import './App.css';

function SearchPage() {
  const [industry, setIndustry] = useState('');
  const [platform, setPlatform] = useState('youtube');
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const industries = [
    'Agriculture',
    'Technology',
    'Finance',
    'Healthcare',
    'Real Estate',
    'Education',
    'Manufacturing',
    'Retail',
    'Energy',
    'Transportation'
  ];

  const platforms = [
    { id: 'youtube', name: 'YouTube', icon: 'fa-youtube' },
    { id: 'twitter', name: 'Twitter', icon: 'fa-twitter' },
    { id: 'facebook', name: 'Facebook', icon: 'fa-facebook-f' }
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/${platform}/channels?industry=${encodeURIComponent(industry)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to fetch channels');
      }
      const data = await response.json();
      setChannels(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching channels:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChannelClick = (channel, platform) => {
    // Use channel.id for YouTube, which we extracted in ChannelCard component
    let channelIdentifier;
    
    if (platform === 'youtube') {
      // For YouTube we use the name, which will be searched by the API
      channelIdentifier = channel.name;
      console.log(`Navigating to YouTube channel: ${channelIdentifier}`);
    } else if (platform === 'facebook' && channel.username) {
      // For Facebook we prefer the username
      channelIdentifier = channel.username;
    } else {
      // Fallback to name for all other cases
      channelIdentifier = channel.name;
    }
    
    console.log(`Navigating to ${platform} channel:`, channelIdentifier);
    navigate(`/channel/${platform}/${encodeURIComponent(channelIdentifier)}`);
  };

  return (
    <div className="App">
      <h1>InFind</h1>
      <div className="search-section">
        <form onSubmit={handleSearch}>
          <div className="platform-icons">
            {platforms.map((p) => (
              <div 
                key={p.id} 
                className={`platform-icon ${platform === p.id ? 'selected' : ''}`}
                onClick={() => setPlatform(p.id)}
                title={p.name}
              >
                <i className={`fab ${p.icon}`}></i>
              </div>
            ))}
          </div>
          <select 
            value={industry} 
            onChange={(e) => setIndustry(e.target.value)}
            required
          >
            <option value="">Select an industry</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Find Influencers'}
          </button>
        </form>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="channels-grid">
        {channels.map((channel, index) => (
          <ChannelCard 
            key={channel.url || index}
            channel={channel}
            platform={channel.platform || platform}
            onChannelClick={handleChannelClick}
          />
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/channel/:platform/:channelName" element={<ChannelDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
