export const CONFIG = {
    // API
    API_PORT: 8000,

    // Detection Settings Defaults
    DEFAULT_AUTO_MODE: true,
    DEFAULT_CONF_THRESHOLD: 0.5,
    DEFAULT_SIZE_THRESHOLD: 0.15,

    // Segmentation Settings Defaults
    DEFAULT_AUTO_SEGMENTATION: false,
    DEFAULT_SEG_MODEL: "YOLO", // "YOLO" | "SAM"
    DEFAULT_TRANSCRIPTION_ENABLED: true,

    // UI
    PAGE_SIZE_CROPS: 100,
    PAGE_SIZE_ANNOTATIONS: 12,
};

export const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    return `http://${hostname}:${CONFIG.API_PORT}`;
};
