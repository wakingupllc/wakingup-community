/* Add additional forum-specific routes in this file. Use addRoute if they're new, or overrideRoute
   if they replace an existing route. */

import { addRoute } from "../vulcan-lib";

   export const wuRoutes = () => {
    // overrideRoute(
    //   {
    //     path:'/login',
    //     name: 'Login',
    //     componentName: "NewForumLoginPage",
    //   }
    // );
    addRoute(
      {
        path:'/code',
        name: 'wuCodeEntry',
        componentName: 'WakingUpHome',
        enableResourcePrefetch: true,
      }
    );
  };
  