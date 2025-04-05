// src/navigation.js

let routerInstance;

export const navigation = {
  setRouter(router) {
    routerInstance = router;
  },

  /**
   * Navigates using router.push. Handles NavigationDuplicated errors.
   * @param {RawLocation} route - The route object or path string prepared by the caller.
   * @returns {Promise<Route | void>} The promise returned by router.push.
   */
  push(route) {
    if (!routerInstance) {
      console.error("Navigation service: Router instance not set.");
      return Promise.reject(new Error("Router instance not set."));
    }
    return routerInstance.push(route).catch(e => {
      // Silently ignore NavigationDuplicated errors, re-throw others.
      if (e.name !== "NavigationDuplicated") { 
        console.error("Router push error:", e);
        throw e; 
      }
    });
  },

  /**
   * Navigates using router.replace. Handles NavigationDuplicated errors.
   * @param {RawLocation} route - The route object or path string prepared by the caller.
   * @returns {Promise<Route | void>} The promise returned by router.replace.
   */
  replace(route) {
    if (!routerInstance) {
      console.error("Navigation service: Router instance not set.");
      return Promise.reject(new Error("Router instance not set."));
    }
    return routerInstance.replace(route).catch(e => {
       // Silently ignore NavigationDuplicated errors, re-throw others.
       if (e.name !== "NavigationDuplicated") { 
         console.error("Router replace error:", e);
         throw e; 
       }
    });
  },
};

Object.freeze(navigation);
