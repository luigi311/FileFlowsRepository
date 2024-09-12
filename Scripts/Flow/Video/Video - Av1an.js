/**
 * Calculate vmaf score of working file compared to original file
 * @author Luigi311
 * @revision 1
 * @minimumVersion 1.0.0.0
 * @param {string} preset Preset to use for encoding
 * @output Success
 */
function Script(preset)
{
    let encoder = 'x265'
    let extra_split = 240
    let encoding_threads = 4
    let encoding_parameters = `-p ${preset} --crf 25 -D 10 -F ${encoding_threads} --pools ${encoding_threads} --no-sao --no-strong-intra-smoothing --bframes 8 --psy-rd 2 --psy-rdoq 1 --aq-mode 3 --ref 6 --deblock -1,-1 --no-rect --me 0 --no-b-intra --qcomp 0.5 --qg-size 8 --no-pmode --pme --wpp --scenecut 80 --max-tu-size 8 --b-pyramid`
    let target_quality = '96'
    let min_q = '13'
    let max_q = '40'

    let thread_process = Flow.Execute({
        command: 'nproc',
        argumentList: []
    });

    Logger.ILog("Setting threads");
    let threads;
    if(thread_process.standardOutput) {
        threads = thread_process.standardOutput
        Logger.ILog('threads: ' + threads);
    }
    if(thread_process.starndardError)
        Logger.ILog('nproc error: ' + thread_process.starndardError);

    if(thread_process.exitCode !== 0){
        Logger.ELog('Failed to get threads: ' + thread_process.exitCode);
        return -1;
    }


    let workers = Math.max(Math.floor(threads / encoding_threads), 1);
    Logger.ILog("Workers: " + workers);

    let output = Flow.TempPath + '/' + Variables.file.NameNoExtension;
    let av1an = Flow.GetToolPath('av1an');
    let process = Flow.Execute({
        command: av1an,
        argumentList: [
            '-i',
            Variables.file.FullName,
            '-y',
            '-e',
            `${encoder}`,
            '-v',
            `${encoding_parameters}`,
            '--probe-slow',
            '--chunk-method',
            'lsmash',
            '--target-quality',
            `${target_quality}`,
            '--min-q',
            `${min_q}`,
            '--max-q',
            `${max_q}`,
            '--concat',
            'mkvmerge',
            '--extra-split',
            `${extra_split}`,
            '--workers',
            `${workers}`,
            '--log-file',
            `${output}`,
            '-o',
            `${output}.mkv`
        ]
    });

    if(process.standardOutput)
        Logger.ILog('Standard output: ' + process.standardOutput);
    if(process.starndardError)
        Logger.ILog('Standard error: ' + process.starndardError);

    if(process.exitCode !== 0){
        Logger.ELog('Failed processing av1an: ' + process.exitCode);
        return -1;
    }

    Flow.SetWorkingFile(output+".mkv");

    return 1;
}