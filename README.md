# Dreamwell - Social Media Channel Analysis Platform

A web application that helps brands find and analyze influencers across multiple social media platforms including YouTube, Twitter, and Facebook.

## Features

- Search for channels/accounts across YouTube, Twitter, and Facebook
- View detailed channel information and statistics
- Generate marketing analysis reports for potential partnerships
- Analyze pros and cons of partnering with specific influencers
- Clean, modern UI with Poppins font and intuitive design

## Setup

### Prerequisites

- Node.js (14.x or higher)
- npm or yarn
- API keys for:
  - YouTube Data API
  - Twitter API
  - Facebook API
  - OpenAI API (for marketing analysis)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/dreamwell.git
   cd dreamwell
   ```

2. Install dependencies for both frontend and backend:
   ```
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Configure environment variables:
   - Copy the `.env.example` file in the backend directory to `.env`
   - Add your API keys to the `.env` file

4. Run the application:
   ```
   # Start the backend server
   cd backend
   npm start

   # In a separate terminal, start the frontend
   cd frontend
   npm start
   ```

## Environment Variables

The following environment variables are required in the `.env` file:

- `YOUTUBE_API_KEY`: Your YouTube Data API key
- `OPENAI_API_KEY`: Your OpenAI API key for generating marketing analyses
- `TWITTER_API_KEY`: Your Twitter API key
- `TWITTER_API_SECRET`: Your Twitter API secret
- `TWITTER_ACCESS_TOKEN`: Your Twitter access token
- `TWITTER_ACCESS_TOKEN_SECRET`: Your Twitter access token secret
- `FACEBOOK_ACCESS_TOKEN`: Your Facebook access token
- `RAPIDAPI_KEY`: Your RapidAPI key (if used)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

[MIT](LICENSE) 