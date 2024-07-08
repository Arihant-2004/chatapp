const corsOptions = {
    origin: [
      "https://chatapp-frontend-1.vercel.app",
      "http://localhost:5173",
      "http://localhost:4173"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  };
  const CHATTU_TOKEN = "chattu-token";

  export { corsOptions, CHATTU_TOKEN };