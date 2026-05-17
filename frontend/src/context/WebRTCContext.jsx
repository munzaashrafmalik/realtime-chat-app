import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const WebRTCContext = createContext();

export const useWebRTC = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within WebRTCProvider');
  }
  return context;
};

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export const WebRTCProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callState, setCallState] = useState('idle'); // idle, calling, ringing, active, ended
  const [callType, setCallType] = useState(null); // audio, video
  const [currentCall, setCurrentCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const peerConnection = useRef(null);
  const callTimerRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_rejected', handleCallRejected);
    socket.on('call_ended', handleCallEnded);
    socket.on('webrtc_offer', handleWebRTCOffer);
    socket.on('webrtc_answer', handleWebRTCAnswer);
    socket.on('ice_candidate', handleICECandidate);

    return () => {
      socket.off('incoming_call');
      socket.off('call_accepted');
      socket.off('call_rejected');
      socket.off('call_ended');
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('ice_candidate');
    };
  }, [socket]);

  const handleIncomingCall = (data) => {
    setIncomingCall(data);
    setCallState('ringing');
  };

  const handleCallAccepted = async (data) => {
    setCallState('active');
    startCallTimer();
  };

  const handleCallRejected = () => {
    setCallState('ended');
    cleanupCall();
    alert('Call was rejected');
  };

  const handleCallEnded = () => {
    setCallState('ended');
    cleanupCall();
  };

  const handleWebRTCOffer = async ({ offer, callId, senderId }) => {
    try {
      await createPeerConnection(senderId);
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit('webrtc_answer', {
        callerId: senderId,
        answer,
        callId
      });
    } catch (error) {
      console.error('Error handling WebRTC offer:', error);
    }
  };

  const handleWebRTCAnswer = async ({ answer }) => {
    try {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling WebRTC answer:', error);
    }
  };

  const handleICECandidate = async ({ candidate }) => {
    try {
      if (peerConnection.current && candidate) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const createPeerConnection = async (targetUserId) => {
    try {
      peerConnection.current = new RTCPeerConnection(ICE_SERVERS);

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice_candidate', {
            targetUserId,
            candidate: event.candidate,
            senderId: user._id
          });
        }
      };

      peerConnection.current.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, localStream);
        });
      }
    } catch (error) {
      console.error('Error creating peer connection:', error);
      throw error;
    }
  };

  const initiateCall = async (receiverId, type) => {
    try {
      setCallType(type);
      setCallState('calling');

      const constraints = {
        audio: true,
        video: type === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      await createPeerConnection(receiverId);

      stream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, stream);
      });

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      socket.emit('call_initiate', {
        callerId: user._id,
        receiverId,
        type
      });

      socket.emit('webrtc_offer', {
        receiverId,
        offer,
        senderId: user._id
      });

      setCurrentCall({ receiverId, type });
    } catch (error) {
      console.error('Error initiating call:', error);
      alert('Failed to access camera/microphone. Please check permissions.');
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    try {
      if (!incomingCall) return;

      setCallType(incomingCall.type);
      setCallState('active');

      const constraints = {
        audio: true,
        video: incomingCall.type === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      socket.emit('call_accept', {
        callId: incomingCall.callId,
        receiverId: user._id
      });

      setCurrentCall({
        receiverId: incomingCall.callerId,
        type: incomingCall.type
      });

      setIncomingCall(null);
      startCallTimer();
    } catch (error) {
      console.error('Error accepting call:', error);
      alert('Failed to access camera/microphone. Please check permissions.');
      rejectCall();
    }
  };

  const rejectCall = () => {
    if (!incomingCall) return;

    socket.emit('call_reject', {
      callId: incomingCall.callId
    });

    setIncomingCall(null);
    setCallState('idle');
  };

  const endCall = () => {
    if (currentCall) {
      socket.emit('call_end', {
        callId: currentCall.callId || 'unknown',
        userId: user._id
      });
    }

    cleanupCall();
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const startCallTimer = () => {
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const cleanupCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    if (remoteStream) {
      setRemoteStream(null);
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    setCallState('idle');
    setCurrentCall(null);
    setCallType(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setCallDuration(0);
  };

  const value = {
    localStream,
    remoteStream,
    callState,
    callType,
    currentCall,
    incomingCall,
    isMuted,
    isVideoOff,
    callDuration,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo
  };

  return <WebRTCContext.Provider value={value}>{children}</WebRTCContext.Provider>;
};
