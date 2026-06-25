# Biometric Authentication - Quick Testing Guide

## Prerequisites

1. Backend server running on `http://localhost:3000/admin`
2. Frontend running on `http://localhost:3000`
3. Modern browser (Chrome, Firefox, Safari, or Edge)
4. Camera/webcam available
5. Fingerprint sensor (optional, for fingerprint testing)

## Test 1: Face Registration

### Steps:

1. Open browser and navigate to `http://localhost:3000`
2. Complete registration flow until biometric setup page
3. Click **"Register Face"** button
4. Allow camera access when prompted
5. Follow on-screen instructions:
   - 👀 Look straight at camera
   - 👈 Turn slightly left
   - 👉 Turn slightly right
   - ⬆️ Tilt slightly up
   - ⬇️ Tilt slightly down
6. Wait for progress bar to reach 100%
7. Verify success message: "✅ Face registered successfully!"

### Expected Results:

- Camera preview shows your face
- Green guide circle appears when face is detected
- Quality indicator shows percentage (should be >60%)
- Progress indicator shows samples captured (0/5 → 5/5)
- Guidance messages update in real-time
- Success message appears after 5 samples

### Common Issues:

- **"Camera access denied"**: Grant permissions in browser settings
- **"Face not detected"**: Improve lighting, remove glasses
- **"Quality too low"**: Center face, ensure good lighting

## Test 2: Face Login

### Steps:

1. Navigate to `http://localhost:3000/login`
2. Enter email/CNIC and password
3. Click **"Sign In"**
4. Select **"Face Recognition"** option
5. Allow camera access when prompted
6. Position face in frame
7. Hold still until detection completes
8. Verify welcome message: "Welcome, [Name]! 👤"

### Expected Results:

- Camera preview shows your face
- Face detection starts automatically
- Progress bar fills as face is detected
- Quality indicator shows detection quality
- Automatic capture after 5 consecutive detections
- Redirect to dashboard after successful verification

### Common Issues:

- **"Face not recognized"**: Re-register face with better quality
- **"Session expired"**: Login again with credentials
- **"Verification failed"**: Ensure same face as registration

## Test 3: Fingerprint Registration

### Steps:

1. Complete registration flow until biometric setup page
2. Click **"Register Fingerprint"** button
3. Confirm in modal dialog
4. Follow browser/OS prompts for fingerprint
5. Verify success message: "✅ Fingerprint registered successfully!"

### Expected Results:

- Modal dialog appears with instructions
- Browser/OS fingerprint prompt appears
- Fingerprint sensor activates
- Success message after successful registration
- Option to proceed to face registration

### Common Issues:

- **"Fingerprint not supported"**: Device doesn't have fingerprint sensor
- **"Registration cancelled"**: Complete fingerprint prompt
- **"Failed to create credentials"**: Try again or use different finger

## Test 4: Fingerprint Login

### Steps:

1. Navigate to `http://localhost:3000/login`
2. Enter email/CNIC and password
3. Click **"Sign In"**
4. Select **"Fingerprint"** option
5. Follow browser/OS prompts for fingerprint
6. Verify welcome message: "Welcome, [Name]! 🔐"

### Expected Results:

- Browser/OS fingerprint prompt appears
- Fingerprint sensor activates
- Verification completes quickly
- Redirect to dashboard after successful verification

### Common Issues:

- **"Fingerprint not recognized"**: Use same finger as registration
- **"Verification cancelled"**: Complete fingerprint prompt
- **"Session expired"**: Login again with credentials

## Test 5: Error Handling

### Test Scenarios:

#### 1. Camera Permission Denied

- **Action**: Deny camera permission when prompted
- **Expected**: Clear error message with instructions
- **Solution**: Grant permission in browser settings

#### 2. No Face Detected

- **Action**: Cover camera or turn away
- **Expected**: "Position your face in the frame" message
- **Solution**: Face camera with good lighting

#### 3. Poor Face Quality

- **Action**: Face camera in dark room or far away
- **Expected**: "Face quality too low" message
- **Solution**: Improve lighting, move closer

#### 4. Multiple Faces

- **Action**: Have multiple people in frame
- **Expected**: "Only one face should be visible" error
- **Solution**: Ensure only one person in frame

#### 5. Network Error

- **Action**: Disconnect internet during verification
- **Expected**: "Failed to fetch" or network error
- **Solution**: Check internet connection

## Test 6: UI/UX

### Visual Elements:

- ✅ Modern card-based layout
- ✅ Progress steps indicator
- ✅ Biometric option cards with icons
- ✅ Modal dialogs for capture
- ✅ Video wrapper with face guide
- ✅ Quality and progress indicators
- ✅ Guidance messages
- ✅ Responsive design

### User Experience:

- ✅ Smooth camera preview
- ✅ Real-time feedback
- ✅ Clear instructions
- ✅ Progress tracking
- ✅ Error messages
- ✅ Success confirmations

## Browser Compatibility

### Tested Browsers:

- ✅ Chrome 90+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Edge 90+

### Required Features:

- `navigator.mediaDevices.getUserMedia`
- `navigator.credentials` (WebAuthn)
- Canvas API
- WebAssembly

## Performance Metrics

### Face Detection:

- Model load time: ~2-3 seconds
- Detection interval: 200ms
- Quality threshold: 60%
- Required detections: 5 consecutive

### Fingerprint:

- Registration time: ~2-5 seconds
- Verification time: ~1-3 seconds

## Troubleshooting

### Issue: Models not loading

**Solution**:

1. Check browser console for errors
2. Refresh page
3. Clear browser cache
4. Check internet connection

### Issue: Camera not working

**Solution**:

1. Check browser permissions
2. Close other apps using camera
3. Try different browser
4. Restart browser

### Issue: Fingerprint not working

**Solution**:

1. Check device has fingerprint sensor
2. Clean fingerprint sensor
3. Try different finger
4. Restart browser

### Issue: Verification fails

**Solution**:

1. Re-register biometric
2. Improve lighting for face
3. Use same finger for fingerprint
4. Check internet connection

## Success Criteria

### Face Registration:

- ✅ Camera opens successfully
- ✅ Face detected in real-time
- ✅ Quality indicator >60%
- ✅ 5 samples captured
- ✅ Success message displayed
- ✅ Data stored in database

### Face Login:

- ✅ Camera opens successfully
- ✅ Face detected and verified
- ✅ Welcome message displayed
- ✅ Redirect to dashboard

### Fingerprint Registration:

- ✅ WebAuthn prompt appears
- ✅ Fingerprint captured
- ✅ Success message displayed
- ✅ Data stored in database

### Fingerprint Login:

- ✅ WebAuthn prompt appears
- ✅ Fingerprint verified
- ✅ Welcome message displayed
- ✅ Redirect to dashboard

## Next Steps

After successful testing:

1. Deploy to production
2. Monitor error logs
3. Gather user feedback
4. Implement improvements
5. Add advanced features

## Support

For issues or questions:

1. Check browser console for errors
2. Review implementation summary
3. Check backend logs
4. Verify API endpoints
5. Test with different browser

