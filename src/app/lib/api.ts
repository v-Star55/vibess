import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  withCredentials: true,
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't intercept refresh endpoint itself to avoid infinite loops
    if (originalRequest.url?.includes("/user/auth/refresh")) {
      return Promise.reject(error);
    }

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await refreshAccessToken();
        
        if (refreshResponse.ok) {
          // Token refreshed successfully, retry original request
          processQueue(null, null);
          return api(originalRequest);
        } else {
          // Refresh failed, redirect to login
          processQueue(new Error("Token refresh failed"), null);
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Request interceptor to proactively refresh token before it expires
api.interceptors.request.use(
  async (config) => {
    // Check if token is about to expire (within 1 minute)
    // We can't read httpOnly cookies from client, so we'll rely on 401 handling
    // But we can add a check here if needed in the future
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);



/// api for login

export async function loginUser(credentials: { identifier: string; password: string }) {
  try {
    const res = await api.post("/user/auth/login", credentials, {
      validateStatus: () => true, // ✅ prevent automatic throws
    });

    // ❌ Throw for all non-200 statuses
    if (res.status !== 200) {
      throw { message: res.data.message || "Login failed", status: res.status, email: res.data?.email };
    }

    // ✅ Success case
    return { ...res.data, status: res.status };

  } catch (error: any) {
    console.error("Login failed:", error);

    // ✅ If error already contains message, rethrow it
    if (error?.message) {
      throw error;
    }

    // ✅ Otherwise, extract from axios response
    if (error.response?.data) {
      throw {
        message: error.response.data.message || "Login failed",
        status: error.response.status || 500,
        email: error.response.data?.email,
      };
    }

    // ✅ Fallback generic error
    throw { message: "Something went wrong", status: 500 };
  }
}


////// LOGOUT User
export async function logoutUser() {
  try{
    const res=await api.get("/user/auth/logout");
    return res;
  }catch(err){
    console.log(err);
  }
}


/////////// Getting User 

export async function getUser() {
  try {
    const res= await api.get('/user/me')
    return res;
  } catch (error) {
    console.log(error);
  }
}


/////////// Getting User Profile

export async function getUserProfile() {
  try {
    const res= await api.get('/user/profile')
    return res;
  } catch (error) {
    console.log(error);
  }
}



/// refreshing the access token
export async function refreshAccessToken() {
  try {
    const res = await api.get("/user/auth/refresh", { 
      validateStatus: () => true,
      maxRedirects: 0, // Don't follow redirects
    });
    
    // If we get a redirect (302/307), the refresh endpoint handled it server-side
    // The new token should be in cookies now, so we can consider it successful
    if (res.status >= 300 && res.status < 400) {
      return { ok: true, message: "Token refreshed via redirect" };
    }
    
    return { ...res.data, status: res.status }; // include ok and status
  } catch (error: any) {
    // If it's a redirect error, that's actually fine - the server handled it
    if (error.response?.status >= 300 && error.response?.status < 400) {
      return { ok: true, message: "Token refreshed via redirect" };
    }
    console.error("Unable to refresh token", error.response?.data || error.message);
    return { ok: false, message: "Something went wrong" };
  }
}



///// Signup api

export async function signupUser(user: {}) {
  try {
    const res = await api.post("/user/auth/signup", user)
    return res.data;
  }
  catch (error: any) {
    console.error("Unable to Resgister User", error.response?.data || error.message)
  }
}


//// sending verifcation mail

export async function verifyOTP(email:string,otp:string) {
    try {
    const res = await api.post("/user/auth/verifyotp",{email,otp})
    return res.data;
  }
  catch (error: any) {
    console.error("Unable to Send Verification mail", error.response?.data || error.message)
  }
}



////////// update profile


export async function updateUserProfile(formData: FormData) {
  try {
    const res = await axios.patch("/api/user/update-profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error: any) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

/////////////////// Storiess

export async function uploadStory(formData: FormData) {
  try {
    const res = await api.post("/user/story", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error: any) {
    console.error("Error uploading story:", error);
    throw error;
  }
}

export async function fetchStories() {
  try {
    const res = await api.get("/user/story");
    return res.data;
  } catch (error: any) {
    console.error("Error fetching stories:", error);
    throw error;
  }
}

////////// update ready to listen status

export async function updateReadyToListen(readyToListen: boolean) {
  try {
    const res = await axios.patch("/api/user/ready-to-listen", { readyToListen });
    return res.data;
  } catch (error: any) {
    console.error("Error updating ready to listen:", error);
    throw error;
  }
}

////////// Fetch Jokes from RapidAPI (via our API route)

export async function fetchJoke() {
  try {
    const res = await api.get('/jokes');
    return res.data;
  } catch (error: any) {
    console.error("Error fetching joke:", error);
    // Return fallback joke if API fails
    return [{ joke: "Why did the developer go broke? Because he used up all his cache!" }];
  }
}

////////// Location API

export async function saveUserLocation(location: { latitude: number; longitude: number }) {
  try {
    const res = await api.post("/user/location", location);
    return res.data;
  } catch (error: any) {
    console.error("Error saving location:", error);
    throw error;
  }
}

export async function getUserLocation() {
  try {
    const res = await api.get("/user/location");
    return res.data;
  } catch (error: any) {
    console.error("Error fetching location:", error);
    throw error;
  }
}

////////// GP (Group) API

export async function getGPsForHome() {
  try {
    const res = await api.get("/gp/home");
    return res.data;
  } catch (error: any) {
    console.error("Error fetching GPs for home:", error);
    throw error;
  }
}

export async function getMyGPs() {
  try {
    const res = await api.get("/gp/my-gps");
    return res.data;
  } catch (error: any) {
    console.error("Error fetching my GPs:", error);
    throw error;
  }
}

export async function joinGP(gpId: string) {
  try {
    const res = await api.post("/gp/join", { gpId });
    return res.data;
  } catch (error: any) {
    console.error("Error joining GP:", error);
    throw error;
  }
}

export async function leaveGP(gpId: string) {
  try {
    const res = await api.post("/gp/leave", { gpId });
    return res.data;
  } catch (error: any) {
    console.error("Error leaving GP:", error);
    throw error;
  }
}

export async function checkGPLimits(category?: string) {
  try {
    const url = category ? `/gp/check-limits?category=${category}` : "/gp/check-limits";
    const res = await api.get(url);
    return res.data;
  } catch (error: any) {
    console.error("Error checking GP limits:", error);
    throw error;
  }
}

export async function getGPDetails(gpId: string) {
  try {
    const res = await api.get(`/gp/${gpId}`);
    return res.data;
  } catch (error: any) {
    console.error("Error fetching GP details:", error);
    throw error;
  }
}

////////// Whisper Space API

export async function createConfession(text: string) {
  try {
    const res = await api.post("/whisper-space/create", { text });
    return res.data;
  } catch (error: any) {
    console.error("Error creating confession:", error);
    throw error;
  }
}

export async function getConfessionsWall(page: number = 1, limit: number = 20) {
  try {
    const res = await api.get(`/whisper-space/wall?page=${page}&limit=${limit}`);
    return res.data;
  } catch (error: any) {
    console.error("Error fetching confessions:", error);
    throw error;
  }
}

export async function reportConfession(confessionId: string) {
  try {
    const res = await api.post("/whisper-space/report", { confessionId });
    return res.data;
  } catch (error: any) {
    console.error("Error reporting confession:", error);
    throw error;
  }
}

export async function checkConfessionLimit() {
  try {
    const res = await api.get("/whisper-space/check-limit");
    return res.data;
  } catch (error: any) {
    console.error("Error checking confession limit:", error);
    throw error;
  }
}

////////// Daily Advice API

export async function getDailyAdvice() {
  try {
    const res = await api.get("/advice/daily");
    return res.data;
  } catch (error: any) {
    console.error("Error fetching daily advice:", error);
    throw error;
  }
}







export default api;