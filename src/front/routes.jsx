// Import necessary components and functions from react-router-dom.
import React from "react";
import { createBrowserRouter } from "react-router-dom";

import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Today } from "./pages/Today";


export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },

      // Auth
      { path: "/auth/login", element: <Login /> },
      { path: "/auth/signup", element: <Signup /> },

      // App
      { path: "/today", element: <Today /> },

    ],
  },
]);