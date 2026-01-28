import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Container,
  StepLabel,
  Step,
  Stepper,
  Divider,
  Button,
  DialogContent,
  Dialog,
  CircularProgress,
  Modal,
  Snackbar,
  Slide,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import type { AlertColor } from "@mui/material/Alert";
import ClearIcon from "@mui/icons-material/Clear";
import LanguageIcon from "@mui/icons-material/Language";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

interface LivenessData {
  result: boolean;
  timeout: boolean;
  score: number;
  message: string;
  transaction_id: string;
  balance_transaction_id: number;
  fc_token: string;
  attempt: number;
  max_attempt_limit: number;
  face_1: string;
  face_2: string;
  send_from: string;
}

function SlideTransition(props: React.ComponentProps<typeof Slide>) {
  return <Slide {...props} direction="down" />;
}

export default function UrlLiveness() {
  const steps = [
    "Enter URL",
    "View Liveness",
    "Capture Result",
  ];

  const [url, setUrl] = useState("");
  const [landingUrl, setLandingUrl] = useState<string | null>(null);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>("success");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [livenessData, setLivenessData] = useState<LivenessData | null>(null);

  const validateUrl = (inputUrl: string): string | null => {
    try {
      let processedUrl = inputUrl.trim();
      if (!processedUrl.startsWith("http://") && !processedUrl.startsWith("https://")) {
        processedUrl = "https://" + processedUrl;
      }
      new URL(processedUrl);
      return processedUrl;
    } catch {
      return null;
    }
  };

  const handleLoadUrl = () => {
    const validatedUrl = validateUrl(url);
    if (!validatedUrl) {
      setSnackbarSeverity("error");
      setSnackbarMessage("Please enter a valid URL");
      setOpenSnackbar(true);
      return;
    }

    setIframeLoading(true);
    setLandingUrl(validatedUrl);
    setCapturedImage(null);
    setLivenessData(null);
  };

  const handleIframeLoad = () => {
    setIframeLoading(false);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleOpenModal = (photoUrl: string) => {
    setSelectedImage(photoUrl);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handleBackToInput = () => {
    setLandingUrl(null);
    setCapturedImage(null);
    setLivenessData(null);
    setIframeLoading(true);
  };

  // Listen for messages from iframe (similar to liveness.tsx)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const data = e.data;

      // Handle messages from iframe if needed
      if (data.source === "privypass_liveness" || data.type === "liveness_result") {
        if (data.data) {
          // Store all liveness data
          const livenessResult: LivenessData = {
            result: data.data.result,
            timeout: data.data.timeout,
            score: data.data.score,
            message: data.data.message,
            transaction_id: data.data.transaction_id,
            balance_transaction_id: data.data.balance_transaction_id,
            fc_token: data.data.fc_token,
            attempt: data.data.attempt,
            max_attempt_limit: data.data.max_attempt_limit,
            face_1: data.data.face_1,
            face_2: data.data.face_2,
            send_from: data.data.send_from,
          };

          setLivenessData(livenessResult);
          setSnackbarSeverity(livenessResult.result ? "success" : "error");
          setSnackbarMessage(livenessResult.result ? "Liveness Berhasil" : "Liveness Gagal");
          setOpenSnackbar(true);

          // If there's face data in the result, capture it
          if (data.data.face_1) {
            setCapturedImage(data.data.face_1);
            setLandingUrl(null);
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <Container
      maxWidth={false}
      sx={{
        px: !landingUrl ? 2 : 0,
        height: !landingUrl ? "auto" : "100vh",
        margin: !landingUrl ? "auto" : 0,
        maxWidth: !landingUrl ? "600px" : "none",
      }}
    >
      <Box
        sx={{
          height: !landingUrl ? "auto" : "100vh",
        }}
      >
        {/* Iframe View - Full Screen like liveness.tsx */}
        {landingUrl ? (
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 1000,
            }}
          >
            {iframeLoading && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 10,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.7)",
                }}
              >
                <Typography sx={{ fontSize: "14px", color: "#14517D", mr: 2 }}>
                  Loading...
                </Typography>
                <CircularProgress sx={{ color: "#14517D" }} size={16} />
              </Box>
            )}

            {/* Back Button */}
            <Box
              sx={{
                position: "absolute",
                top: 10,
                left: 10,
                zIndex: 20,
              }}
            >
              <Button
                variant="contained"
                onClick={handleBackToInput}
                sx={{
                  bgcolor: "#14517D",
                  borderRadius: "20px",
                  "&:hover": {
                    bgcolor: "#0d3d5e",
                  },
                }}
              >
                ← Back
              </Button>
            </Box>

            <iframe
              id="liveness-iframe"
              title="Liveness Iframe"
              src={landingUrl}
              width="100%"
              height="100%"
              allow="camera;microphone;"
              scrolling="yes"
              style={{
                border: "none",
                pointerEvents: "auto",
                overflow: "auto",
              }}
              onLoad={handleIframeLoad}
            />
          </Box>
        ) : (
          /* Input Form View */
          <Box sx={{ padding: 2 }}>
            {/* Stepper */}
            <Box sx={{ width: "100%", mb: 3 }}>
              <Stepper activeStep={capturedImage ? 2 : 0} alternativeLabel>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel
                      sx={{
                        ".MuiStepLabel-label": {
                          fontSize: "0.6rem",
                        },
                        width: "100%",
                      }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

            {/* Header */}
            <Typography
              gutterBottom
              sx={{
                fontWeight: "bold",
                color: "#14517D",
              }}
            >
              URL Liveness Checker
            </Typography>
            <Divider
              sx={{
                borderColor: "#D99D2F",
                borderWidth: 1,
                marginY: 1,
              }}
            />
            <Typography
              gutterBottom
              sx={{
                paddingBottom: "10px",
                textAlign: "justify",
                fontSize: "12px",
              }}
            >
              Enter a liveness URL below to embed it in an iframe. This works similarly
              to the liveness verification process where the URL is displayed in a
              full-screen iframe.
            </Typography>

            <Typography
              gutterBottom
              sx={{
                paddingBottom: "5px",
                textAlign: "justify",
                fontSize: "12px",
                fontWeight: "bold",
                color: "#D99D2F",
              }}
            >
              Enter Liveness URL!
            </Typography>

            {/* URL Input */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="https://example.com/liveness"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleLoadUrl();
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LanguageIcon sx={{ color: "#14517D" }} />
                    </InputAdornment>
                  ),
                  endAdornment: url && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setUrl("")}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "15px",
                    "&:hover fieldset": {
                      borderColor: "#14517D",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#14517D",
                    },
                  },
                }}
              />
            </Box>

            {/* Captured Result Section - Shows liveness data and image */}
            {(capturedImage || livenessData) && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  mb: 10,
                }}
              >
                {/* Liveness Result Status */}
                {livenessData && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: "15px",
                      backgroundColor: livenessData.result ? "#e8f5e9" : "#ffebee",
                      border: `2px solid ${livenessData.result ? "#4caf50" : "#f44336"}`,
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                      {livenessData.result ? (
                        <CheckCircleIcon sx={{ color: "#4caf50", fontSize: 28 }} />
                      ) : (
                        <ErrorIcon sx={{ color: "#f44336", fontSize: 28 }} />
                      )}
                      <Typography
                        sx={{
                          fontWeight: "bold",
                          fontSize: "16px",
                          color: livenessData.result ? "#2e7d32" : "#c62828",
                        }}
                      >
                        {livenessData.result ? "Liveness Berhasil" : "Liveness Gagal"}
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Result Details */}
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                      <Box sx={{ width: "45%" }}>
                        <Typography sx={{ fontSize: "11px", color: "#666" }}>Score</Typography>
                        <Typography sx={{ fontSize: "14px", fontWeight: "bold", color: "#14517D" }}>
                          {livenessData.score?.toFixed(2) || "-"}
                        </Typography>
                      </Box>
                      <Box sx={{ width: "45%" }}>
                        <Typography sx={{ fontSize: "11px", color: "#666" }}>Attempt</Typography>
                        <Typography sx={{ fontSize: "14px", fontWeight: "bold", color: "#14517D" }}>
                          {livenessData.attempt} / {livenessData.max_attempt_limit}
                        </Typography>
                      </Box>
                      <Box sx={{ width: "100%" }}>
                        <Typography sx={{ fontSize: "11px", color: "#666" }}>Message</Typography>
                        <Typography sx={{ fontSize: "12px", color: "#333" }}>
                          {livenessData.message || "-"}
                        </Typography>
                      </Box>
                      <Box sx={{ width: "100%" }}>
                        <Typography sx={{ fontSize: "11px", color: "#666" }}>Transaction ID</Typography>
                        <Typography sx={{ fontSize: "11px", color: "#333", wordBreak: "break-all" }}>
                          {livenessData.transaction_id || "-"}
                        </Typography>
                      </Box>
                      {livenessData.timeout && (
                        <Box sx={{ width: "100%" }}>
                          <Typography sx={{ fontSize: "12px", color: "#ff9800", fontWeight: "bold" }}>
                            ⚠️ Timeout occurred
                          </Typography>
                        </Box>
                      )}
                      {livenessData.fc_token && (
                        <Box sx={{ width: "100%" }}>
                          <Typography sx={{ fontSize: "11px", color: "#666" }}>FC Token</Typography>
                          <Typography
                            sx={{
                              fontSize: "10px",
                              color: "#333",
                              wordBreak: "break-all",
                              backgroundColor: "#f5f5f5",
                              p: 1,
                              borderRadius: "5px",
                            }}
                          >
                            {livenessData.fc_token}
                          </Typography>
                        </Box>
                      )}
                      {livenessData.send_from && (
                        <Box sx={{ width: "45%" }}>
                          <Typography sx={{ fontSize: "11px", color: "#666" }}>Send From</Typography>
                          <Typography sx={{ fontSize: "12px", color: "#333" }}>
                            {livenessData.send_from}
                          </Typography>
                        </Box>
                      )}
                      {livenessData.balance_transaction_id && (
                        <Box sx={{ width: "45%" }}>
                          <Typography sx={{ fontSize: "11px", color: "#666" }}>Balance Transaction ID</Typography>
                          <Typography sx={{ fontSize: "12px", color: "#333" }}>
                            {livenessData.balance_transaction_id}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Captured Image */}
                {capturedImage && (
                  <Box>
                    <Typography
                      gutterBottom
                      sx={{
                        textAlign: "center",
                        paddingTop: 2,
                        fontSize: "12px",
                      }}
                    >
                      <b>Hasil Foto Liveness</b>
                    </Typography>
                    <Box
                      sx={{
                        width: "100%",
                        height: "200px",
                        maxHeight: "170px",
                        overflow: "hidden",
                        borderRadius: "20px",
                        marginTop: 2,
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "#f5f5f5",
                      }}
                      onClick={() => handleOpenModal(capturedImage)}
                    >
                      <img
                        src={capturedImage}
                        alt="Liveness Result"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {/* Fixed Bottom Button */}
            <Box
              sx={{
                width: "100%",
                position: "fixed",
                bottom: 0,
                left: 0,
                padding: 2,
                backgroundColor: "white",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Button
                  variant="contained"
                  sx={{
                    width: "100%",
                    maxWidth: "568px",
                    borderRadius: "30px",
                    bgcolor: "#14517D",
                    "&:hover": {
                      bgcolor: "#0d3d5e",
                    },
                    "&:disabled": {
                      bgcolor: "#ccc",
                    },
                  }}
                  onClick={capturedImage ? handleBackToInput : handleLoadUrl}
                  disabled={!url.trim()}
                >
                  {capturedImage ? "Selesai" : "Load Liveness URL"}
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={openSnackbar}
        onClose={handleCloseSnackbar}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={3000}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Image Preview Modal */}
      <Modal
        open={!!selectedImage}
        onClose={handleCloseModal}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "80%",
            maxWidth: "600px",
            bgcolor: "white",
            borderRadius: "10px",
            overflow: "hidden",
            padding: 2,
          }}
        >
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Preview"
              style={{
                width: "100%",
                height: "auto",
                objectFit: "contain",
              }}
            />
          )}

          <Button
            onClick={handleCloseModal}
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              bgcolor: "rgba(255, 255, 255, 0.8)",
              borderRadius: "50%",
              minWidth: "40px",
              height: "40px",
            }}
          >
            <ClearIcon sx={{ fontSize: "20px", color: "red" }} />
          </Button>
        </Box>
      </Modal>

      {/* Loading Dialog - kept for potential future use */}
      <Dialog
        open={false}
        PaperProps={{
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(2px)",
            boxShadow: "none",
          },
        }}
        fullScreen
      >
        <DialogContent
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            color: "white",
          }}
        />
      </Dialog>
    </Container>
  );
}
