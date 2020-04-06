module.exports = {
  src_folders: ['test-e2e/test'],
  custom_commands_path: ['test-e2e/commands'],
  output_folder: false,
  // test_settings: {
  //   default: {
  //     globals: {
  //       asyncHookTimeout : 60000
  //     }
  //   }
  // },
  __extend: {
    headless: true,
  },
}
