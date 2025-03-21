const ChannelCard = ({ channel, platform, onChannelClick }) => {
  const handleCardClick = () => {
    // Only allow clicking YouTube channels
    if (platform === 'youtube') {
      onChannelClick(channel, platform);
    }
  };

  // Determine the appropriate term based on platform
  const followerTerm = platform === 'youtube' ? 'subscribers' : 'followers';

  return (
    <div 
      className={`channel-card ${platform === 'youtube' ? 'clickable' : 'disabled'}`} 
      onClick={handleCardClick}
      data-platform={platform}
    >
      <div className="channel-info">
        <h3 className="channel-name">{channel.name}</h3>
        <p className="platform-badge">{platform}</p>
        <p className="subscribers">{channel.subscribers} {followerTerm}</p>
        <p className="description">{channel.description}</p>
        {platform !== 'youtube' && (
          <div className="details-notice">
            Details not available
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelCard; 