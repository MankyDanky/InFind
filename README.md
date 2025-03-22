# InFind

A web application that helps brands find and analyze influencers across multiple social media platforms including YouTube, Twitter, and Facebook.

## Preview
<img width="1459" alt="Screenshot 2025-03-21 at 5 53 10 PM" src="https://github.com/user-attachments/assets/76b936ff-c637-43d4-8542-905f5f3e1bff" />
<img width="1461" alt="Screenshot 2025-03-21 at 5 53 37 PM" src="https://github.com/user-attachments/assets/025b1dda-ce42-408c-a0b4-1bca80ddcc7f" />
<img width="1460" alt="Screenshot 2025-03-21 at 5 54 04 PM" src="https://github.com/user-attachments/assets/557b9738-6a7e-4549-b5b6-26346e49aebf" />
<img width="1460" alt="Screenshot 2025-03-21 at 5 54 26 PM" src="https://github.com/user-attachments/assets/80284ad7-570e-4df1-ac11-79ab58aa4d11" />
<img width="1459" alt="Screenshot 2025-03-21 at 5 54 43 PM" src="https://github.com/user-attachments/assets/3c73ea21-b992-4346-ada8-f975a0a8c7cb" />
<img width="1451" alt="Screenshot 2025-03-21 at 5 56 37 PM" src="https://github.com/user-attachments/assets/a039eed1-2923-4448-89a3-7c2b01ceea49" />
<img width="1454" alt="Screenshot 2025-03-21 at 9 48 47 PM" src="https://github.com/user-attachments/assets/d957be45-8a73-4a24-9293-0916f4e8ce46" />


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
