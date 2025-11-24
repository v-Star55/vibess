import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Fallback jokes array
const fallbackJokes = [
  "Why did the developer go broke? Because he used up all his cache!",
  "Why do programmers prefer dark mode? Because light attracts bugs!",
  "How do you comfort a JavaScript bug? You console it!",
  "Why did the React component feel lost? Because it didn't know what state it was in!",
  "What's a programmer's favorite hangout place? Foo Bar!",
  "Why do Java developers wear glasses? Because they can't C#!",
  "How many programmers does it take to change a light bulb? None, that's a hardware problem!",
  "Why did the database administrator leave his wife? She had one-to-many relationships!",
  "What's the object-oriented way to become wealthy? Inheritance!",
  "Why do Python programmers prefer dark mode? Because light mode is too bright!"
];

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.RAPIDAPI_KEY;
    
    // If no API key is set, return a random fallback joke
    if (!apiKey || apiKey === 'RAPIDAPI-KEY') {
      const randomJoke = fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)];
      return NextResponse.json([{ joke: randomJoke }], { status: 200 });
    }
    
    const res = await axios.get('https://jokes-by-api-ninjas.p.rapidapi.com/v1/jokes', {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'jokes-by-api-ninjas.p.rapidapi.com'
      }
    });
    
    return NextResponse.json(res.data, { status: 200 });
  } catch (error: any) {
    // Handle 403 (Forbidden) or 401 (Unauthorized) - API key issues
    if (error?.response?.status === 403 || error?.response?.status === 401) {
      const randomJoke = fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)];
      return NextResponse.json([{ joke: randomJoke }], { status: 200 });
    }
    
    // For other errors, also return fallback
    const randomJoke = fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)];
    return NextResponse.json([{ joke: randomJoke }], { status: 200 });
  }
}

