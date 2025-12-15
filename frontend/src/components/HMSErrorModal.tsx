// HMS Error Modal - Updated Dec 4 2025 for attr field support
import { useEffect } from 'react';
import { X, AlertTriangle, AlertCircle, Info, ExternalLink } from 'lucide-react';
import type { HMSError } from '../api/client';

interface HMSErrorModalProps {
  printerName: string;
  errors: HMSError[];
  onClose: () => void;
}

// HMS error code descriptions keyed by full HMS code (attr + code combined)
// Format: "AAAA_BBBB_CCCC_DDDD" where AAAA_BBBB is from attr, CCCC_DDDD is from code
// Sources: Bambu Lab Wiki (wiki.bambulab.com) and community databases
const HMS_DESCRIPTIONS: Record<string, string> = {
  // ============ 0300 Series: MC (Motion Controller) ============
  // Temperature errors (0300_0100)
  '0300_0100_0001_0001': 'The heatbed temperature has exceeded the limit. Please check if the thermistor is functioning properly.',
  '0300_0100_0001_0002': 'The heatbed temperature is abnormal. The sensor may be disconnected or damaged.',
  '0300_0100_0001_0003': 'The nozzle temperature has exceeded the limit. Please check if the thermistor is functioning properly.',
  '0300_0100_0001_0004': 'The nozzle temperature is abnormal. The sensor may be disconnected or damaged.',
  '0300_0100_0001_0005': 'The heatbed temperature sensor may be shorted. Please check the connection.',
  '0300_0100_0001_0006': 'The heatbed temperature is abnormal; the sensor may have a short circuit.',
  '0300_0100_0002_0054': 'The heatbed temperature is abnormal. The sensor may be disconnected or damaged.',
  // Fan errors (0300_0300)
  '0300_0300_0001_0001': 'The hotend cooling fan speed is too slow or stopped. It may be stuck or the connector may not be plugged in properly.',
  '0300_0300_0001_0002': 'The part cooling fan speed is too slow or stopped. Please check if it is stuck or damaged.',
  '0300_0300_0001_0003': 'The auxiliary fan speed is too slow or stopped. Please check if it is stuck or damaged.',
  '0300_0300_0001_0004': 'The chamber fan speed is too slow or stopped. Please check if it is stuck or damaged.',
  '0300_0400_0002_0001': 'The speed of part cooling fan is too slow or stopped.',
  '0300_3500_0001_0001': 'The MC module cooling fan speed is too slow or stopped. It may be stuck, or the connector may not be plugged in properly.',
  // Motor errors (0300_0600, 0300_0700, 0300_0800)
  '0300_0400_0001_0001': 'Motor X axis has lost steps. Home the printer and retry.',
  '0300_0400_0001_0002': 'Motor Y axis has lost steps. Home the printer and retry.',
  '0300_0400_0001_0003': 'Motor Z axis has lost steps. Home the printer and retry.',
  '0300_0400_0001_0004': 'Motor E axis has lost steps. Check extruder for clogs.',
  '0300_0600_0001_0001': 'Motor-A has an open-circuit. There may be a loose connection, or the motor may have failed.',
  '0300_0600_0001_0002': 'Motor-A has a short-circuit. It may have failed.',
  '0300_0600_0001_0003': 'The resistance of Motor-A is abnormal, the motor may have failed.',
  '0300_0700_0001_0001': 'Motor-B has an open-circuit. The connection may be loose, or the motor may have failed.',
  '0300_0700_0001_0002': 'Motor-B has a short-circuit. It may have failed.',
  '0300_0800_0001_0001': 'Motor-Z has an open-circuit.',
  '0300_0800_0001_0002': 'Motor-Z has a short-circuit.',
  '0300_E300_0001_0002': 'MC communication with hotend holder motor driver failed. Please check if the connection cable is properly plugged in.',
  // Force sensor errors (0300_0A00)
  '0300_0A00_0001_0004': 'An external disturbance was detected on force sensor 1. The heatbed plate may have touched something outside the heatbed.',
  '0300_0A00_0001_0005': 'Force sensor 1 detected unexpected continuous force. The heatbed may be stuck, or the analog front end may be broken.',
  // Resonance/calibration (0300_1000)
  '0300_1000_0001_0001': 'Failed to home X axis. Check for obstructions.',
  '0300_1000_0001_0002': 'Failed to home Y axis. Check for obstructions.',
  '0300_1000_0001_0003': 'Failed to home Z axis. Check for obstructions.',
  '0300_1000_0002_0001': 'The 1st order mechanical resonance mode of X axis is low.',
  '0300_1000_0002_0002': 'The 1st order mechanical resonance mode of Y axis is low.',
  // Build plate (0300_0D00)
  '0300_0D00_0001_0001': 'Build plate is not installed. Please install the build plate.',
  '0300_0D00_0001_0002': 'Build plate type mismatch. Please check the plate matches your print settings.',
  '0300_0D00_0001_0003': 'The build plate may not be properly placed. Please check the plate is correctly positioned.',
  '0300_0D00_0002_0001': 'Foreign objects detected on the build plate. Please clean the build plate.',

  // ============ 0500 Series: Mainboard/System ============
  // Media/Storage (0500_0100)
  '0500_0100_0002_0001': 'The media pipeline is malfunctioning. Please restart the printer.',
  '0500_0100_0002_0002': 'USB camera is not connected.',
  '0500_0100_0002_0003': 'USB camera is malfunctioning. Please check the connection.',
  '0500_0100_0003_0004': 'Not enough space on SD Card. Please free up space or replace the card.',
  '0500_0100_0003_0005': 'Error reading SD Card. Please reinsert or replace the card.',
  '0500_0100_0003_0006': 'SD Card is unformatted. Please format to FAT32.',
  '0500_0100_0005_0000': 'Motor X axis lost steps.',
  '0500_0100_0005_0001': 'Motor Y axis lost steps.',
  '0500_0100_0005_0002': 'Motor Z axis lost steps.',
  '0500_0100_0005_0005': 'Motor driver overheated. Let the printer cool down.',
  '0500_0100_0005_0006': 'Motor driver communication error.',
  // Network (0500_0200)
  '0500_0200_0001_0001': 'WiFi module is malfunctioning. Please restart the printer.',
  '0500_0200_0002_0001': 'Failed to connect to internet. Please check your network connection.',
  '0500_0200_0002_0002': 'Failed to login to device. Please check your credentials.',
  '0500_0200_0002_0003': 'Network connection unstable. Please move printer closer to router.',
  // Module communication (0500_0300)
  '0500_0300_0001_0001': 'The MC module is malfunctioning. Please restart the device.',
  '0500_0300_0001_0002': 'The toolhead is malfunctioning. Please restart the device.',
  '0500_0300_0001_0003': 'The AMS module is malfunctioning. Please restart the device.',
  '0500_0300_0001_000A': 'System state is abnormal. Please restore factory settings.',
  '0500_0300_0001_000B': 'The screen is malfunctioning. Please restart the device.',
  '0500_0300_0001_000C': 'The MC motor controller module is malfunctioning. Please power off, check the connection, and restart the device.',
  '0500_0300_0002_000C': 'Wireless hardware error. Please turn off/on WiFi or restart the device.',
  '0500_0300_0002_000E': 'Some modules are incompatible with the printer firmware version. Please update firmware.',
  '0500_0300_0002_0020': 'USB flash drive capacity is insufficient to cache print files.',
  // System errors (0500_0500)
  '0500_0500_0001_0007': 'System error. Please restart the device.',
  // Print job/Cloud (0500_0400)
  '0500_0400_0001_0001': 'Failed to download print job. Please check your network connection.',
  '0500_0400_0001_0002': 'Failed to report print state. Please check your network connection.',
  '0500_0400_0001_0003': 'The print file is unreadable. Please resend the print job.',
  '0500_0400_0001_0004': 'The print file is unauthorized.',
  '0500_0400_0001_0005': 'Print job download timeout. Please check network and retry.',
  '0500_0400_0001_0006': 'Failed to resume previous print.',
  '0500_0400_0001_0049': 'Cloud connection error. Please check your network and retry.',
  '0500_0400_0001_0051': 'Emergency Stop Button is not in the right position. Please check and reset.',
  '0500_0400_0001_0052': 'Safety Key is not inserted. Please follow the Wiki to install it.',
  // Camera/Module errors (0500_0400_0002)
  '0500_0400_0002_0001': 'Print file transfer failed. Please retry.',
  '0500_0400_0002_0002': 'Print file verification failed. Please resend the file.',
  '0500_0400_0002_0030': 'The BirdsEye Camera is not installed. Please power off printer and install the camera.',
  '0500_0400_0002_0031': 'The BirdsEye Camera is malfunctioning. Please check the connection.',
  '0500_0400_0002_0032': 'The BirdsEye Camera is dirty or obscured. Please clean it.',
  '0500_0400_0002_0033': 'Please plug in the module connector.',
  '0500_0400_0002_0040': 'The chamber camera is not installed.',
  '0500_0400_0002_0041': 'The chamber camera is malfunctioning.',
  '0500_0400_0002_0042': 'The live camera is dirty or obscured. Please clean it and continue.',
  '0500_0400_0002_0043': 'The toolhead camera is dirty or obscured. Please clean it and continue.',
  '0500_0400_0002_0044': 'Camera initialization failed. Please restart the printer.',
  '0500_0400_0002_0045': 'Camera communication error. Please check connections.',
  // Screen/Display (0500_0600)
  '0500_0600_0001_0001': 'Screen communication error. Please restart the device.',
  '0500_0600_0002_0054': 'Screen firmware error. Please update firmware.',

  // ============ 0700 Series: AMS (Automatic Material System) ============
  '0700_0100_0001_0001': 'AMS is not responding. Please restart the printer.',
  '0700_0100_0001_0002': 'AMS communication timeout. Check connections.',
  '0700_0100_0007_0001': 'AMS communication error.',
  '0700_0100_0007_0002': 'AMS filament runout.',
  '0700_0100_0007_0003': 'AMS filament not detected.',
  '0700_2000_0001_0001': 'AMS slot 1 filament tangled or stuck.',
  '0700_2000_0001_0002': 'AMS slot 2 filament tangled or stuck.',
  '0700_2000_0001_0003': 'AMS slot 3 filament tangled or stuck.',
  '0700_2000_0001_0004': 'AMS slot 4 filament tangled or stuck.',
  '0700_2000_0002_0001': 'AMS motor overload. Check if filament is stuck.',
  '0700_2000_0003_0001': 'AMS cutter is stuck. Please check and clear.',
  '0700_2000_0003_0002': 'AMS cutter malfunction. Please check the cutter.',
  '0700_4000_0001_0001': 'AMS humidity sensor error.',
  '0700_4000_0001_0002': 'AMS desiccant needs replacement.',
  '0700_5000_0001_0001': 'AMS RFID reader error. Unable to read filament info.',
  '0700_5500_0002_0001': 'A binding error occurred between AMS and the extruder. Please perform AMS initialization again.',
  // Filament/hotend matching (0700_7000, 0700_F000)
  '0700_7000_0002_000A': 'Failed to get filament-hotend mapping table from the slicing file.',
  '0700_F000_0002_0001': 'Filament and hotend matching failed. Please verify that the hotend in the hotend rack slot is correctly installed.',

  // ============ 0C00 Series: XCam/Lidar ============
  // Toolhead camera/Lidar (0C00_0100)
  '0C00_0100_0001_0001': 'Toolhead Camera is offline. Please check the hardware connection.',
  '0C00_0100_0001_0002': 'Micro Lidar initialization failed. Please restart.',
  '0C00_0100_0001_0003': 'Micro Lidar synchronization abnormal.',
  '0C00_0100_0001_0004': 'Toolhead Camera lens seems to be dirty. Please clean the lens.',
  '0C00_0100_0001_0005': 'Micro Lidar OTP parameter abnormal.',
  '0C00_0100_0001_0009': 'Chamber camera dirty.',
  '0C00_0100_0001_000A': 'The Micro Lidar LED may be broken.',
  '0C00_0100_0001_000B': 'Failed to calibrate Micro Lidar. Please make sure the calibration chart is clean and not obscured.',
  '0C00_0100_0001_0011': 'The Live View Camera calibration failed, please recalibrate.',
  '0C00_0100_0002_0008': 'Failed to get image from chamber camera.',
  // AI detection (0C00_0100_000C)
  '0C00_0100_000C_0001': 'First layer inspection detected defects. Check print adhesion.',
  '0C00_0100_000C_0002': 'Spaghetti failure detected by AI monitoring.',
  '0C00_0100_000C_0003': 'First layer inspection failed.',
  '0C00_0100_000C_0004': 'Nozzle clog detected.',
  '0C00_0100_000C_0005': 'Purged filament piled up in waste chute.',
  '0C00_0100_000C_8000': 'Foreign object detected on print bed.',
  // Build plate detection (0C00_0300)
  '0C00_0300_0002_000C': 'The build plate localization marker was not detected. Please check if the build plate is aligned correctly.',
  '0C00_0300_0002_001C': 'Your nozzle seems to be covered with jammed or clogged material.',
  // Live camera (0C00_0400)
  '0C00_0400_0002_0026': 'Liveview Camera initialization failed, and some AI functions such as Spaghetti Detection will be disabled. Please restart the printer.',
  // AI system (0C00_0200)
  '0C00_0200_0001_0001': 'AI camera initialization failed.',
  '0C00_0200_0001_0002': 'AI detection confidence low. Print may have issues.',

  // ============ 1200 Series: External Spool (H2D/A1) ============
  '1200_0100_0001_0001': 'External spool filament runout.',
  '1200_0100_0001_0002': 'External spool filament stuck.',
  '1200_0100_0002_0001': 'Failed to load filament from external spool.',
  '1200_0100_0002_0002': 'Failed to unload filament from external spool.',
};

function getSeverityInfo(severity: number): { label: string; color: string; bgColor: string; Icon: typeof AlertTriangle } {
  switch (severity) {
    case 1:
      return { label: 'Fatal', color: 'text-red-500', bgColor: 'bg-red-500/20', Icon: AlertTriangle };
    case 2:
      return { label: 'Serious', color: 'text-red-400', bgColor: 'bg-red-500/15', Icon: AlertTriangle };
    case 3:
      return { label: 'Warning', color: 'text-orange-400', bgColor: 'bg-orange-500/20', Icon: AlertCircle };
    case 4:
    default:
      return { label: 'Info', color: 'text-blue-400', bgColor: 'bg-blue-500/20', Icon: Info };
  }
}

function getFullHMSCode(attr: number, code: number): string {
  // Construct the full HMS code from attr and code
  // Format: AAAA_BBBB_CCCC_DDDD
  // AAAA_BBBB from attr, CCCC_DDDD from code
  const a1 = ((attr >> 24) & 0xFF).toString(16).padStart(2, '0').toUpperCase();
  const a2 = ((attr >> 16) & 0xFF).toString(16).padStart(2, '0').toUpperCase();
  const a3 = ((attr >> 8) & 0xFF).toString(16).padStart(2, '0').toUpperCase();
  const a4 = (attr & 0xFF).toString(16).padStart(2, '0').toUpperCase();

  const c1 = ((code >> 24) & 0xFF).toString(16).padStart(2, '0').toUpperCase();
  const c2 = ((code >> 16) & 0xFF).toString(16).padStart(2, '0').toUpperCase();
  const c3 = ((code >> 8) & 0xFF).toString(16).padStart(2, '0').toUpperCase();
  const c4 = (code & 0xFF).toString(16).padStart(2, '0').toUpperCase();

  return `${a1}${a2}_${a3}${a4}_${c1}${c2}_${c3}${c4}`;
}

function getHMSHomeUrl(): string {
  // HMS home page - searchable index of all error codes (always works)
  return `https://wiki.bambulab.com/en/hms/home`;
}

export function HMSErrorModal({ printerName, errors, onClose }: HMSErrorModalProps) {
  // Debug: log errors to see what data we're receiving
  console.log('HMSErrorModal errors:', JSON.stringify(errors, null, 2));

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bambu-dark-secondary rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-bambu-dark-tertiary">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-white">HMS Errors - {printerName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-bambu-dark-tertiary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-bambu-gray" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {errors.length === 0 ? (
            <div className="text-center py-8 text-bambu-gray">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No HMS errors</p>
            </div>
          ) : (
            <div className="space-y-3">
              {errors.map((error, index) => {
                const { label, color, bgColor, Icon } = getSeverityInfo(error.severity);
                const codeNum = parseInt(error.code.replace('0x', ''), 16) || 0;
                const fullHMSCode = getFullHMSCode(error.attr, codeNum);
                const description = HMS_DESCRIPTIONS[fullHMSCode] || 'Search the HMS wiki for more information.';
                const hmsHomeUrl = getHMSHomeUrl();
                const displayCode = `HMS_${fullHMSCode.replace(/_/g, '-')}`;

                return (
                  <div
                    key={`${error.code}-${index}`}
                    className={`p-4 rounded-lg ${bgColor} border border-white/10`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 ${color} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-mono text-sm ${color}`}>{displayCode}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${bgColor} ${color}`}>
                            {label}
                          </span>
                        </div>
                        <p className="text-sm text-bambu-gray mb-2">{description}</p>
                        <a
                          href={hmsHomeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-bambu-green hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View on Bambu Lab Wiki
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-bambu-dark-tertiary">
          <p className="text-xs text-bambu-gray">
            HMS (Health Management System) monitors printer health. Clear errors on the printer to dismiss them here.
          </p>
        </div>
      </div>
    </div>
  );
}
