import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  firebase: {
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT,
    databaseURL: process.env.FIREBASE_DATABASE_URL
  },
  apis: {
    newsApiKey: process.env.NEWS_API_KEY,
    animeApiUrl: process.env.ANIME_API_URL || 'https://api.jikan.moe/v4',
    poetryApiUrl: process.env.POETRY_API_URL || 'https://poetrydb.org',
    dictionaryApiUrl: process.env.DICTIONARY_API_URL || 'https://api.dictionaryapi.dev/api/v2',
    urbanDictApiUrl: process.env.URBAN_DICT_API_URL || 'https://api.urbandictionary.com/v0',
    jokeApiUrl: process.env.JOKE_API_URL || 'https://official-joke-api.appspot.com',
    adviceApiUrl: process.env.ADVICE_API_URL || 'https://api.adviceslip.com',
    memeApiUrl: process.env.MEME_API_URL || 'https://meme-api.com/gimme',
    genderApiUrl: process.env.GENDER_API_URL || 'https://api.genderize.io',
    horoscopeApiUrl: process.env.HOROSCOPE_API_URL || 'https://horoscope-app-api.vercel.app/api/v1'
  },
  rateLimit: {
    maxRequestsPerMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '20'),
    maxCommandsPerUser: parseInt(process.env.MAX_COMMANDS_PER_USER || '10')
  }
};
