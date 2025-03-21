const ChannelCard = ({ channel, platform, onChannelClick }) => {
  const handleCardClick = () => {
    // Allow clicking YouTube, Facebook, and Twitter channels
    if (platform === 'youtube' || platform === 'facebook' || platform === 'twitter') {
      onChannelClick(channel, platform);
    }
  };

  // Determine the appropriate term based on platform
  const followerTerm = platform === 'youtube' ? 'subscribers' : 'followers';

  return (
    <div 
      className={`channel-card ${platform === 'youtube' || platform === 'facebook' || platform === 'twitter' ? 'clickable' : 'disabled'}`} 
      onClick={handleCardClick}
      data-platform={platform}
    >
      <div className="channel-info">
        <h3 className="channel-name">{channel.name}</h3>
        <p className="platform-badge">{platform}</p>
        <p className="subscribers">{channel.subscribers} {followerTerm}</p>
        <p className="description">{channel.description}</p>
        {platform !== 'youtube' && platform !== 'facebook' && platform !== 'twitter' && (
          <div className="details-notice">
            Details not available
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelCard; 