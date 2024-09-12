/**
 * Plot VMAF json file
 * @author Luigi311
 * @revision 1
 * @minimumVersion 1.0.0.0
 * @param {string} json_file Json file containing vmaf information, empty for ${Flow.TempPath}/${file.NameNoExtension}.json
 * @param {string} plot_extension Extension for plot, default svg
 * @param {string} title Title of the plot, empty for ${file.NameNoExtension}
 * @param {string} av1an_log Optional av1an log file to extract crf values from
 * @output VMAF plot succeeded
 */
// Download url for plot_vmaf.py
let plot_vmaf_url =
  "https://raw.githubusercontent.com/luigi311/Plot_Vmaf/master/plot_vmaf.py";

function run_executable(executable, arguments) {
  let executable_process = Flow.Execute({
    command: executable,
    argumentList: [...arguments],
  });

  if (executable_process.exitCode !== 0) {
    Logger.ELog(executable_process.standardOutput);
    Logger.ELog(executable_process.standardError);
    return executable_process.exitCode;
  }

  return 0;
}

function Script(json_file, plot_extension, title, av1an_log) {
  Logger.ELog(`TempPath: ${Flow.TempPath}`);

  let python3 = Flow.GetToolPath("python3");
  // Allow overriding python3 instance with user defined path
  if (!python3) {
    python3 = "python3";
  }

  let plot_vmaf_script = Flow.GetToolPath("plot_vmaf");
  if (!plot_vmaf_script) {
    plot_vmaf_script = "plot_vmaf.py";
  }

  // Check if plot_vmaf.py is installed if not install it
  if (run_executable(python3, [plot_vmaf_script, "-h"]) !== 0) {
    Logger.ELog("plot_vmaf.py is not installed, installing it");

    if (run_executable("curl", ["-o", plot_vmaf_script, plot_vmaf_url]) !== 1) {
      return -1;
    }

    if (run_executable(python3, [plot_vmaf_script, "-h"]) !== 0) {
      Logger.ELog("Failed to install plot_vmaf.py");
      return -1;
    }
  }

  // Set default values
  if (!json_file || String(json_file).trim().length === 0) {
    json_file = `${Flow.TempPath}/${Variables.file.NameNoExtension}.json`;
  }

  let plot_file = `${Flow.TempPath}/${Variables.file.NameNoExtension}.`;
  
  if (!plot_extension || String(plot_extension).trim().length === 0){
    plot_file = plot_file + 'svg';
  } else {
    plot_file = plot_file + plot_extension;
  }


  if (!title || String(title).trim().length === 0) {
    title = `${Variables.file.NameNoExtension}`;
  }

  // If no av1an log is provided then try default location
  if (!av1an_log || String(av1an_log).trim().length === 0) {
    av1an_log = `${Flow.TempPath}/${Variables.file.NameNoExtension}.log`;
  }

  // If av1an log exists then use it
  let av1an_flag = [];
  if (System.IO.File.Exists(av1an_log) === true) {
    Logger.ILog(`Using av1an log: ${av1an_log}`);
    av1an_flag = ["--av1an", av1an_log];
  }

  if (
    run_executable(python3, [
      plot_vmaf_script,
      json_file,
      "--output",
      plot_file,
      "--title",
      title,
      ...av1an_flag,
    ]) !== 0
  ) {
    Logger.ELog("Failed to plot VMAF");
    return -1;
  }

  return 1;
}