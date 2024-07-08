const corsOptions = {
    origin: [
      "https://chatapp-frontend-1.vercel.app/login"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  };
  const CHATTU_TOKEN = "chattu-token";

  export { corsOptions, CHATTU_TOKEN };