/*
  This file sets up all environment configs for the available build configurations:
   - dev_environment --> Development environment, not packaged. Use this environment to develop
   - prod_environment --> Production environment. Can be packaged. This environment is used when building the app
   - dev_environment_packaged --> This is a dev environment meant for packaging. It doesn't include live reloading, which causes errors when the app is packaged
*/

// dev_environment
exports.dev_environment = {
    dev: true,
    auto_reload: true
}

// prod_environment
exports.prod_environment = {
  dev: false,
  auto_reload: false
}

// dev_environment_packaged
const dev_env_packaged = exports.dev_environment;
dev_env_packaged.auto_reload = false;
exports.dev_environment_packaged = dev_env_packaged;
