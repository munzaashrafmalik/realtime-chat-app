import { useEffect, useRef } from 'react';

const ActiveCallWindow = ({
  localStream,
  remoteStream,
  callType,
  isMuted,
  isVideoOff,
  callDuration,
  onToggleMute,
  onToggleVideo,
  onEndCall,
  remotePeerName
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 bg-opacity-90 px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-white text-xl font-semibold">{remotePeerName || 'Unknown User'}</h2>
          <p className="text-gray-400 text-sm">{formatDuration(callDuration)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-green-500 w-3 h-3 rounded-full animate-pulse"></span>
          <span className="text-white text-sm">Connected</span>
        </div>
      </div>

      {/* Video Streams */}
      <div className="flex-1 relative">
        {callType === 'video' ? (
          <>
            {/* Remote Video (Main) */}
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <div className="w-32 h-32 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-6xl">👤</span>
                  </div>
                  <p className="text-white text-lg">Waiting for video...</p>
                </div>
              )}
            </div>

            {/* Local Video (Picture-in-Picture) */}
            <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-2xl border-2 border-gray-600">
              {localStream && !isVideoOff ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-700">
                  <span className="text-4xl">📷</span>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Audio Call UI */
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
            <div className="text-center">
              <div className="w-48 h-48 bg-white bg-opacity-20 rounded-full mx-auto mb-8 flex items-center justify-center backdrop-blur-sm">
                <span className="text-9xl">🎵</span>
              </div>
              <h3 className="text-white text-3xl font-semibold mb-2">{remotePeerName}</h3>
              <p className="text-gray-300 text-xl">{formatDuration(callDuration)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Call Controls */}
      <div className="bg-gray-800 bg-opacity-90 px-6 py-6">
        <div className="flex justify-center items-center gap-6">
          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className={`${
              isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
            } text-white rounded-full p-4 transition-all transform hover:scale-110 shadow-lg`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            )}
          </button>

          {/* Video Toggle Button (only for video calls) */}
          {callType === 'video' && (
            <button
              onClick={onToggleVideo}
              className={`${
                isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
              } text-white rounded-full p-4 transition-all transform hover:scale-110 shadow-lg`}
              title={isVideoOff ? 'Turn On Video' : 'Turn Off Video'}
            >
              {isVideoOff ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3l18 18"
                  />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={onEndCall}
            className="bg-red-600 hover:bg-red-700 text-white rounded-full p-5 transition-all transform hover:scale-110 shadow-lg"
            title="End Call"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
              />
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};

export default ActiveCallWindow;
