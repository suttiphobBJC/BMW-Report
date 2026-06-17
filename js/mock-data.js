// Mock Data Seed for BMW Quality Portal
const MOCK_DATA = {
    // 1. PPM Module
    ppm_targets: [
        { code: "SMR - Hungary", target: 5500 },
        { code: "SMR - Mexico", target: 5500 },
        { code: "SMP", target: 5500 },
        { code: "Pro-X(Rehau)", target: 5500 }
    ],
    ppm_data: [
        // 2025 Data (From User Sheet)
        { date: "2025-01-15", customer: "SMR - Hungary", code: "", defect_qty: 0, shipped_qty: 1690 },
        { date: "2025-02-15", customer: "SMR - Hungary", code: "", defect_qty: 0, shipped_qty: 2390 },
        { date: "2025-03-15", customer: "SMR - Hungary", code: "", defect_qty: 0, shipped_qty: 1760 },
        { date: "2025-04-15", customer: "SMR - Hungary", code: "", defect_qty: 1, shipped_qty: 2680 },
        { date: "2025-05-15", customer: "SMR - Hungary", code: "", defect_qty: 22, shipped_qty: 2950 },
        { date: "2025-06-15", customer: "SMR - Hungary", code: "", defect_qty: 30, shipped_qty: 2550 },
        { date: "2025-07-15", customer: "SMR - Hungary", code: "", defect_qty: 25, shipped_qty: 1990 },
        { date: "2025-08-15", customer: "SMR - Hungary", code: "", defect_qty: 50, shipped_qty: 1780 },
        { date: "2025-09-15", customer: "SMR - Hungary", code: "", defect_qty: 30, shipped_qty: 2480 },
        { date: "2025-10-15", customer: "SMR - Hungary", code: "", defect_qty: 129, shipped_qty: 2720 },
        { date: "2025-11-15", customer: "SMR - Hungary", code: "", defect_qty: 12, shipped_qty: 3960 },
        { date: "2025-12-15", customer: "SMR - Hungary", code: "", defect_qty: 7, shipped_qty: 2360 },

        { date: "2025-07-15", customer: "SMR - Mexico", code: "", defect_qty: 0, shipped_qty: 35 },
        { date: "2025-08-15", customer: "SMR - Mexico", code: "", defect_qty: 0, shipped_qty: 300 },
        { date: "2025-09-15", customer: "SMR - Mexico", code: "", defect_qty: 2, shipped_qty: 150 },
        { date: "2025-10-15", customer: "SMR - Mexico", code: "", defect_qty: 0, shipped_qty: 350 },
        { date: "2025-11-15", customer: "SMR - Mexico", code: "", defect_qty: 0, shipped_qty: 350 },
        { date: "2025-12-15", customer: "SMR - Mexico", code: "", defect_qty: 1, shipped_qty: 300 },

        { date: "2025-01-15", customer: "SMP", code: "", defect_qty: 0, shipped_qty: 495 },
        { date: "2025-02-15", customer: "SMP", code: "", defect_qty: 0, shipped_qty: 450 },
        { date: "2025-03-15", customer: "SMP", code: "", defect_qty: 0, shipped_qty: 465 },
        { date: "2025-04-15", customer: "SMP", code: "", defect_qty: 0, shipped_qty: 255 },
        { date: "2025-05-15", customer: "SMP", code: "", defect_qty: 0, shipped_qty: 720 },
        { date: "2025-06-15", customer: "SMP", code: "", defect_qty: 0, shipped_qty: 420 },
        { date: "2025-07-15", customer: "SMP", code: "", defect_qty: 0, shipped_qty: 600 },
        { date: "2025-08-15", customer: "SMP", code: "", defect_qty: 0, shipped_qty: 165 },
        { date: "2025-09-15", customer: "SMP", code: "", defect_qty: 0, shipped_qty: 570 },
        { date: "2025-10-15", customer: "SMP", code: "", defect_qty: 1, shipped_qty: 570 },
        { date: "2025-11-15", customer: "SMP", code: "", defect_qty: 0, shipped_qty: 675 },
        { date: "2025-12-15", customer: "SMP", code: "", defect_qty: 0, shipped_qty: 285 },

        { date: "2025-01-15", customer: "Pro-X(Rehau)", code: "", defect_qty: 0, shipped_qty: 555 },
        { date: "2025-02-15", customer: "Pro-X(Rehau)", code: "", defect_qty: 0, shipped_qty: 435 },
        { date: "2025-03-15", customer: "Pro-X(Rehau)", code: "", defect_qty: 1, shipped_qty: 465 },
        { date: "2025-04-15", customer: "Pro-X(Rehau)", code: "", defect_qty: 0, shipped_qty: 450 },
        { date: "2025-05-15", customer: "Pro-X(Rehau)", code: "", defect_qty: 0, shipped_qty: 195 },
        { date: "2025-06-15", customer: "Pro-X(Rehau)", code: "", defect_qty: 0, shipped_qty: 210 },
        { date: "2025-07-15", customer: "Pro-X(Rehau)", code: "", defect_qty: 1, shipped_qty: 195 },
        { date: "2025-08-15", customer: "Pro-X(Rehau)", code: "", defect_qty: 0, shipped_qty: 105 },
        { date: "2025-09-15", customer: "Pro-X(Rehau)", code: "", defect_qty: 0, shipped_qty: 210 },
        { date: "2025-10-15", customer: "Pro-X(Rehau)", code: "", defect_qty: 0, shipped_qty: 210 },
        { date: "2025-11-15", customer: "Pro-X(Rehau)", code: "", defect_qty: 0, shipped_qty: 285 },
        { date: "2025-12-15", customer: "Pro-X(Rehau)", code: "", defect_qty: 0, shipped_qty: 285 },

        // 2026 Data (Tuned to exactly match 7,350 Yearly Average and SMR/SMP PPM heights)
        { date: "2026-01-15", customer: "SMR - Hungary", code: "", defect_qty: 25, shipped_qty: 10283 }, // 2,431 PPM
        { date: "2026-01-15", customer: "SMR - Mexico", code: "", defect_qty: 0, shipped_qty: 100 },
        { date: "2026-01-15", customer: "SMP", code: "", defect_qty: 0, shipped_qty: 2270 },
        { date: "2026-01-15", customer: "Pro-X(Rehau)", code: "", defect_qty: 0, shipped_qty: 2270 },

        { date: "2026-02-15", customer: "SMR - Hungary", code: "", defect_qty: 10, shipped_qty: 9009 }, // 1,110 PPM
        { date: "2026-02-15", customer: "SMR - Mexico", code: "", defect_qty: 0, shipped_qty: 100 },
        { date: "2026-02-15", customer: "SMP", code: "", defect_qty: 0, shipped_qty: 2270 },
        { date: "2026-02-15", customer: "Pro-X(Rehau)", code: "", defect_qty: 0, shipped_qty: 2270 },

        { date: "2026-03-15", customer: "SMR - Hungary", code: "", defect_qty: 287, shipped_qty: 10033 }, // 28,605 PPM
        { date: "2026-03-15", customer: "SMR - Mexico", code: "", defect_qty: 1, shipped_qty: 666 },       // 1,501 PPM
        { date: "2026-03-15", customer: "SMP", code: "", defect_qty: 0, shipped_qty: 2270 },
        { date: "2026-03-15", customer: "Pro-X(Rehau)", code: "", defect_qty: 0, shipped_qty: 2270 }
    ],

    // 2. Claim Part Returned Module
    claims_data: [
        // 2025 Claims
        { date: "2025-01-10", project: "G8X-SMR", claim_type: "Surface Scratch", location: "Munich", qty: 25 },
        { date: "2025-02-14", project: "G8X-SMR", claim_type: "Surface Scratch", location: "Munich", qty: 18 },
        { date: "2025-03-20", project: "G8X-SMP", claim_type: "Crack", location: "Dingolfing", qty: 12 },
        { date: "2025-04-11", project: "G8X-SMP", claim_type: "Delamination", location: "Regensburg", qty: 30 },
        { date: "2025-05-09", project: "G8X-SMR", claim_type: "Dimensional Deviation", location: "Leipzig", qty: 15 },
        { date: "2025-06-18", project: "G8X-SMR", claim_type: "Surface Scratch", location: "Munich", qty: 22 },
        { date: "2025-07-22", project: "G8X-SMP", claim_type: "Crack", location: "Dingolfing", qty: 9 },
        { date: "2025-08-15", project: "G8X-SMP", claim_type: "Delamination", location: "Regensburg", qty: 27 },

        // 2026 Claims
        { date: "2026-01-12", project: "G8X-SMR", claim_type: "Surface Scratch", location: "Munich", qty: 28 },
        { date: "2026-02-18", project: "G8X-SMR", claim_type: "Surface Scratch", location: "Munich", qty: 22 },
        { date: "2026-03-24", project: "G8X-SMP", claim_type: "Crack", location: "Dingolfing", qty: 16 },
        { date: "2026-04-15", project: "G8X-SMP", claim_type: "Delamination", location: "Regensburg", qty: 35 },
        { date: "2026-05-12", project: "G8X-SMR", claim_type: "Dimensional Deviation", location: "Leipzig", qty: 18 },
        { date: "2026-06-20", project: "G8X-SMR", claim_type: "Surface Scratch", location: "Munich", qty: 26 },
        { date: "2026-07-25", project: "G8X-SMP", claim_type: "Crack", location: "Dingolfing", qty: 14 },
        { date: "2026-08-20", project: "G8X-SMP", claim_type: "Delamination", location: "Regensburg", qty: 32 }
    ],

    // 3. Yield Module
    yield_targets: [
        { project: "G8X", process: "Layup", target: 90 },
        { project: "G8X", process: "Trimming", target: 90 },
        { project: "G8X", process: "Gluing", target: 80 },
        { project: "G8X", process: "Sanding", target: 90 },
        { project: "G8X", process: "Dry Sanding", target: 90 },
        { project: "G8X", process: "Painting", target: 85 },
        { project: "G8X", process: "Polishing", target: 90 }
    ],
    // Separate sheets for FPY and FY
    yield_fpy_data: [
        // 2025 Monthly averages (summarized or entered monthly)
        { date: "2025-01-01", project: "G8X", process: "Layup", ins: 1000, ok: 880 },
        { date: "2025-02-01", project: "G8X", process: "Layup", ins: 1100, ok: 968 },
        { date: "2025-03-01", project: "G8X", process: "Layup", ins: 1200, ok: 1056 },
        { date: "2025-04-01", project: "G8X", process: "Layup", ins: 1050, ok: 924 },
        { date: "2025-05-01", project: "G8X", process: "Layup", ins: 1150, ok: 1012 },
        { date: "2025-06-01", project: "G8X", process: "Layup", ins: 1250, ok: 1100 },
        { date: "2025-07-01", project: "G8X", process: "Layup", ins: 1300, ok: 1144 },
        { date: "2025-08-01", project: "G8X", process: "Layup", ins: 1200, ok: 1056 },
        { date: "2025-09-01", project: "G8X", process: "Layup", ins: 1100, ok: 968 },
        { date: "2025-10-01", project: "G8X", process: "Layup", ins: 1150, ok: 1012 },
        { date: "2025-11-01", project: "G8X", process: "Layup", ins: 1200, ok: 1056 },
        { date: "2025-12-01", project: "G8X", process: "Layup", ins: 1250, ok: 1100 },

        // 2026 Monthly details
        { date: "2026-01-01", project: "G8X", process: "Layup", ins: 1200, ok: 1080 }, // 90%
        { date: "2026-02-01", project: "G8X", process: "Layup", ins: 1300, ok: 1182 }, // 90.9%
        { date: "2026-03-01", project: "G8X", process: "Layup", ins: 1400, ok: 1282 }, // 91.6%
        { date: "2026-04-01", project: "G8X", process: "Layup", ins: 1100, ok: 1002 }, // 91.1%
        { date: "2026-05-01", project: "G8X", process: "Layup", ins: 1250, ok: 1101 }, // 88.1%
        { date: "2026-06-01", project: "G8X", process: "Layup", ins: 1350, ok: 1253 }, // 92.8%
        { date: "2026-07-01", project: "G8X", process: "Layup", ins: 1400, ok: 1319 }, // 94.2%

        // Other processes for 2026-01-01
        { date: "2026-01-01", project: "G8X", process: "Trimming", ins: 1080, ok: 960 },
        { date: "2026-01-01", project: "G8X", process: "Gluing", ins: 960, ok: 750 },
        { date: "2026-01-01", project: "G8X", process: "Sanding", ins: 750, ok: 660 },
        { date: "2026-01-01", project: "G8X", process: "Dry Sanding", ins: 660, ok: 580 },
        { date: "2026-01-01", project: "G8X", process: "Painting", ins: 580, ok: 480 },
        { date: "2026-01-01", project: "G8X", process: "Polishing", ins: 480, ok: 430 }
    ],
    yield_fy_data: [
        // 2025 Monthly averages
        { date: "2025-01-01", project: "G8X", process: "Layup", ins: 1000, ok: 990 },
        { date: "2025-02-01", project: "G8X", process: "Layup", ins: 1100, ok: 1089 },
        { date: "2025-03-01", project: "G8X", process: "Layup", ins: 1200, ok: 1188 },
        { date: "2025-04-01", project: "G8X", process: "Layup", ins: 1050, ok: 1040 },
        { date: "2025-05-01", project: "G8X", process: "Layup", ins: 1150, ok: 1139 },
        { date: "2025-06-01", project: "G8X", process: "Layup", ins: 1250, ok: 1238 },
        { date: "2025-07-01", project: "G8X", process: "Layup", ins: 1300, ok: 1287 },
        { date: "2025-08-01", project: "G8X", process: "Layup", ins: 1200, ok: 1188 },
        { date: "2025-09-01", project: "G8X", process: "Layup", ins: 1100, ok: 1089 },
        { date: "2025-10-01", project: "G8X", process: "Layup", ins: 1150, ok: 1139 },
        { date: "2025-11-01", project: "G8X", process: "Layup", ins: 1200, ok: 1188 },
        { date: "2025-12-01", project: "G8X", process: "Layup", ins: 1250, ok: 1238 },

        // 2026 Monthly details
        { date: "2026-01-01", project: "G8X", process: "Layup", ins: 1200, ok: 1200 }, // 100.0%
        { date: "2026-02-01", project: "G8X", process: "Layup", ins: 1300, ok: 1297 }, // 99.8%
        { date: "2026-03-01", project: "G8X", process: "Layup", ins: 1400, ok: 1392 }, // 99.4%
        { date: "2026-04-01", project: "G8X", process: "Layup", ins: 1100, ok: 1089 }, // 99.0%
        { date: "2026-05-01", project: "G8X", process: "Layup", ins: 1250, ok: 1223 }, // 97.8%
        { date: "2026-06-01", project: "G8X", process: "Layup", ins: 1350, ok: 1341 }, // 99.3%
        { date: "2026-07-01", project: "G8X", process: "Layup", ins: 1400, ok: 1394 }, // 99.6%

        // Other processes for 2026-01-01
        { date: "2026-01-01", project: "G8X", process: "Trimming", ins: 1080, ok: 1070 },
        { date: "2026-01-01", project: "G8X", process: "Gluing", ins: 960, ok: 900 },
        { date: "2026-01-01", project: "G8X", process: "Sanding", ins: 750, ok: 740 },
        { date: "2026-01-01", project: "G8X", process: "Dry Sanding", ins: 660, ok: 655 },
        { date: "2026-01-01", project: "G8X", process: "Painting", ins: 580, ok: 560 },
        { date: "2026-01-01", project: "G8X", process: "Polishing", ins: 480, ok: 478 }
    ],

    // 4. WIP Module
    wip_targets: [
        { type: "LHD", target: 2360 },
        { type: "RHD", target: 960 },
        { type: "Diffuser", target: 700 }
    ],
    wip_data: [
        // Jan 2026
        { date: "2026-01-01", type: "LHD", total_wip: 2404, pending_rework: 56, active_wip: 2348 },
        { date: "2026-01-01", type: "RHD", total_wip: 1096, pending_rework: 28, active_wip: 1068 },
        { date: "2026-01-01", type: "Diffuser", total_wip: 693, pending_rework: 0, active_wip: 693 },
        
        // Feb 2026
        { date: "2026-02-01", type: "LHD", total_wip: 2500, pending_rework: 50, active_wip: 2450 },
        { date: "2026-02-01", type: "RHD", total_wip: 1096, pending_rework: 28, active_wip: 1068 },
        { date: "2026-02-01", type: "Diffuser", total_wip: 693, pending_rework: 0, active_wip: 693 },

        // Mar 2026
        { date: "2026-03-01", type: "LHD", total_wip: 2380, pending_rework: 60, active_wip: 2320 },
        { date: "2026-03-01", type: "RHD", total_wip: 1096, pending_rework: 28, active_wip: 1068 },
        { date: "2026-03-01", type: "Diffuser", total_wip: 693, pending_rework: 0, active_wip: 693 },

        // Apr 2026
        { date: "2026-04-01", type: "LHD", total_wip: 2289, pending_rework: 40, active_wip: 2249 },
        { date: "2026-04-01", type: "RHD", total_wip: 1096, pending_rework: 28, active_wip: 1068 },
        { date: "2026-04-01", type: "Diffuser", total_wip: 673, pending_rework: 0, active_wip: 673 },

        // May 2026
        { date: "2026-05-01", type: "LHD", total_wip: 2262, pending_rework: 45, active_wip: 2217 },
        { date: "2026-05-01", type: "RHD", total_wip: 1096, pending_rework: 28, active_wip: 1068 },
        { date: "2026-05-01", type: "Diffuser", total_wip: 686, pending_rework: 0, active_wip: 686 },

        // Jun 2026
        { date: "2026-06-01", type: "LHD", total_wip: 2400, pending_rework: 48, active_wip: 2352 },
        { date: "2026-06-01", type: "RHD", total_wip: 1096, pending_rework: 28, active_wip: 1068 },
        { date: "2026-06-01", type: "Diffuser", total_wip: 716, pending_rework: 0, active_wip: 716 }
    ],

    // 5. Rework Rate Module
    rework_data: [
        // 2025 Rework Data
        { date: "2025-01-15", process_status: "Avg. Waiting for Rework (pcs)", erp_code: "G8X-013-103", qty: 29 },
        { date: "2025-01-15", process_status: "Avg. Reworked Insert (pcs)", erp_code: "G8X-013-103", qty: 36 },
        { date: "2025-02-15", process_status: "Avg. Waiting for Rework (pcs)", erp_code: "G8X-013-103", qty: 36 },
        { date: "2025-02-15", process_status: "Avg. Reworked Insert (pcs)", erp_code: "G8X-013-103", qty: 39 },
        { date: "2025-03-15", process_status: "Avg. Waiting for Rework (pcs)", erp_code: "G8X-013-103", qty: 34 },
        { date: "2025-03-15", process_status: "Avg. Reworked Insert (pcs)", erp_code: "G8X-013-103", qty: 37 },
        { date: "2025-04-15", process_status: "Avg. Waiting for Rework (pcs)", erp_code: "G8X-013-103", qty: 38 },
        { date: "2025-04-15", process_status: "Avg. Reworked Insert (pcs)", erp_code: "G8X-013-103", qty: 40 },
        { date: "2025-05-15", process_status: "Avg. Waiting for Rework (pcs)", erp_code: "G8X-013-103", qty: 41 },
        { date: "2025-05-15", process_status: "Avg. Reworked Insert (pcs)", erp_code: "G8X-013-103", qty: 43 },
        { date: "2025-06-15", process_status: "Avg. Waiting for Rework (pcs)", erp_code: "G8X-013-103", qty: 39 },
        { date: "2025-06-15", process_status: "Avg. Reworked Insert (pcs)", erp_code: "G8X-013-103", qty: 45 },
        { date: "2025-07-15", process_status: "Avg. Waiting for Rework (pcs)", erp_code: "G8X-013-103", qty: 42 },
        { date: "2025-07-15", process_status: "Avg. Reworked Insert (pcs)", erp_code: "G8X-013-103", qty: 46 },
        { date: "2025-08-15", process_status: "Avg. Waiting for Rework (pcs)", erp_code: "G8X-013-103", qty: 45 },
        { date: "2025-08-15", process_status: "Avg. Reworked Insert (pcs)", erp_code: "G8X-013-103", qty: 48 },
        { date: "2025-09-15", process_status: "Avg. Waiting for Rework (pcs)", erp_code: "G8X-013-103", qty: 48 },
        { date: "2025-09-15", process_status: "Avg. Reworked Insert (pcs)", erp_code: "G8X-013-103", qty: 52 },
        { date: "2025-10-15", process_status: "Avg. Waiting for Rework (pcs)", erp_code: "G8X-013-103", qty: 46 },
        { date: "2025-10-15", process_status: "Avg. Reworked Insert (pcs)", erp_code: "G8X-013-103", qty: 50 },
        { date: "2025-11-15", process_status: "Avg. Waiting for Rework (pcs)", erp_code: "G8X-013-103", qty: 50 },
        { date: "2025-11-15", process_status: "Avg. Reworked Insert (pcs)", erp_code: "G8X-013-103", qty: 55 },
        { date: "2025-12-15", process_status: "Avg. Waiting for Rework (pcs)", erp_code: "G8X-013-103", qty: 48 },
        { date: "2025-12-15", process_status: "Avg. Reworked Insert (pcs)", erp_code: "G8X-013-103", qty: 53 },

        // 2026 Rework Data
        { date: "2026-01-15", process_status: "Avg. Waiting for Rework (pcs)", erp_code: "G8X-013-103", qty: 314 },
        { date: "2026-01-15", process_status: "Avg. Reworked Insert (pcs)", erp_code: "G8X-013-103", qty: 60 },
        { date: "2026-02-15", process_status: "Avg. Waiting for Rework (pcs)", erp_code: "G8X-013-103", qty: 341 },
        { date: "2026-02-15", process_status: "Avg. Reworked Insert (pcs)", erp_code: "G8X-013-103", qty: 74 },
        { date: "2026-03-15", process_status: "Avg. Waiting for Rework (pcs)", erp_code: "G8X-013-103", qty: 81 },
        { date: "2026-03-15", process_status: "Avg. Reworked Insert (pcs)", erp_code: "G8X-013-103", qty: 87 },
        { date: "2026-04-15", process_status: "Avg. Waiting for Rework (pcs)", erp_code: "G8X-013-103", qty: 64 },
        { date: "2026-04-15", process_status: "Avg. Reworked Insert (pcs)", erp_code: "G8X-013-103", qty: 37 },
        { date: "2026-05-15", process_status: "Avg. Waiting for Rework (pcs)", erp_code: "G8X-013-103", qty: 65 },
        { date: "2026-05-15", process_status: "Avg. Reworked Insert (pcs)", erp_code: "G8X-013-103", qty: 52 },
        { date: "2026-06-15", process_status: "Avg. Waiting for Rework (pcs)", erp_code: "G8X-013-103", qty: 63 },
        { date: "2026-06-15", process_status: "Avg. Reworked Insert (pcs)", erp_code: "G8X-013-103", qty: 55 },
        { date: "2026-07-15", process_status: "Avg. Waiting for Rework (pcs)", erp_code: "G8X-013-103", qty: 68 },
        { date: "2026-07-15", process_status: "Avg. Reworked Insert (pcs)", erp_code: "G8X-013-103", qty: 58 },
        { date: "2026-08-15", process_status: "Avg. Waiting for Rework (pcs)", erp_code: "G8X-013-103", qty: 62 },
        { date: "2026-08-15", process_status: "Avg. Reworked Insert (pcs)", erp_code: "G8X-013-103", qty: 56 },
        { date: "2026-09-15", process_status: "Avg. Waiting for Rework (pcs)", erp_code: "G8X-013-103", qty: 65 },
        { date: "2026-09-15", process_status: "Avg. Reworked Insert (pcs)", erp_code: "G8X-013-103", qty: 60 }
    ],

    // 6. Scrap Analysis Module (Input Table)
    scrap_data: [
        // 2025 Data
        { date: "2025-01-15", process_status: "Layup:OK", erp_code: "G8X-013-103", qty: 950 },
        { date: "2025-01-15", process_status: "Layup:Scrap", erp_code: "G8X-013-103", qty: 50 },
        { date: "2025-02-15", process_status: "Layup:OK", erp_code: "G8X-013-103", qty: 960 },
        { date: "2025-02-15", process_status: "Layup:Scrap", erp_code: "G8X-013-103", qty: 40 },
        { date: "2025-03-15", process_status: "Layup:OK", erp_code: "G8X-013-103", qty: 930 },
        { date: "2025-03-15", process_status: "Layup:Scrap", erp_code: "G8X-013-103", qty: 70 },
        
        { date: "2025-01-10", process_status: "Painting:OK", erp_code: "G8X-011-102", qty: 450 },
        { date: "2025-01-10", process_status: "Painting:Scrap", erp_code: "G8X-011-102", qty: 50 },
        { date: "2025-02-10", process_status: "Painting:OK", erp_code: "G8X-011-102", qty: 470 },
        { date: "2025-02-10", process_status: "Painting:Scrap", erp_code: "G8X-011-102", qty: 30 },

        // 2026 Data
        { date: "2026-01-10", process_status: "Layup:OK", erp_code: "G8X-013-103", qty: 980 },
        { date: "2026-01-10", process_status: "Layup:Scrap", erp_code: "G8X-013-103", qty: 20 },
        { date: "2026-02-12", process_status: "Layup:OK", erp_code: "G8X-013-103", qty: 990 },
        { date: "2026-02-12", process_status: "Layup:Scrap", erp_code: "G8X-013-103", qty: 10 },
        { date: "2026-03-15", process_status: "Layup:OK", erp_code: "G8X-013-103", qty: 975 },
        { date: "2026-03-15", process_status: "Layup:Scrap", erp_code: "G8X-013-103", qty: 25 },
        { date: "2026-04-18", process_status: "Layup:OK", erp_code: "G8X-013-103", qty: 940 },
        { date: "2026-04-18", process_status: "Layup:Scrap", erp_code: "G8X-013-103", qty: 60 },
        { date: "2026-05-20", process_status: "Layup:OK", erp_code: "G8X-013-103", qty: 985 },
        { date: "2026-05-20", process_status: "Layup:Scrap", erp_code: "G8X-013-103", qty: 15 },
        { date: "2026-06-25", process_status: "Layup:OK", erp_code: "G8X-013-103", qty: 992 },
        { date: "2026-06-25", process_status: "Layup:Scrap", erp_code: "G8X-013-103", qty: 8 },
        { date: "2026-07-05", process_status: "Layup:OK", erp_code: "G8X-013-103", qty: 980 },
        { date: "2026-07-05", process_status: "Layup:Scrap", erp_code: "G8X-013-103", qty: 20 },

        // Sanding, Gluing etc for 2026
        { date: "2026-01-12", process_status: "Painting:OK", erp_code: "G8X-011-102", qty: 500 },
        { date: "2026-01-12", process_status: "Painting:Scrap", erp_code: "G8X-011-102", qty: 50 },
        { date: "2026-02-14", process_status: "Painting:OK", erp_code: "G8X-011-102", qty: 520 },
        { date: "2026-02-14", process_status: "Painting:Scrap", erp_code: "G8X-011-102", qty: 40 },
        { date: "2026-03-18", process_status: "Painting:OK", erp_code: "G8X-011-102", qty: 550 },
        { date: "2026-03-18", process_status: "Painting:Scrap", erp_code: "G8X-011-102", qty: 45 }
    ],

    // Master Scrap Targets
    scrap_targets: [
        { process: "Layup", target: 2 },
        { process: "Trimming", target: 2 },
        { process: "Gluing", target: 4 },
        { process: "Sanding", target: 3 },
        { process: "Drysanding", target: 2 },
        { process: "Painting", target: 8 },
        { process: "Polishing", target: 2 }
    ],

    // Top Scrap Data (Daily Scrap Defect Breakdown & Input Inventory)
    scrap_daily: [
        // 2025 Defects
        { date: "2025-01-10", process: "Layup", erp_code: "G8X-013-103", defect: "Void / Air bubble", qty: 10 },
        { date: "2025-01-12", process: "Layup", erp_code: "G8X-013-103", defect: "Fiber distortion", qty: 15 },
        { date: "2025-01-15", process: "Trimming", erp_code: "G8X-013-103", defect: "Delamination", qty: 8 },
        { date: "2025-01-18", process: "Painting", erp_code: "G8X-013-103", defect: "Dust / Dirt inclusion", qty: 20 },
        { date: "2025-01-20", process: "Painting", erp_code: "G8X-013-103", defect: "Orange peel", qty: 12 },

        { date: "2025-02-10", process: "Layup", erp_code: "G8X-011-102", defect: "Void / Air bubble", qty: 12 },
        { date: "2025-02-12", process: "Painting", erp_code: "G8X-011-102", defect: "Dust / Dirt inclusion", qty: 18 },

        // 2026 Defects
        { date: "2026-01-10", process: "Layup", erp_code: "G8X-013-103", defect: "Void / Air bubble", qty: 8 },
        { date: "2026-01-12", process: "Layup", erp_code: "G8X-013-103", defect: "Fiber distortion", qty: 12 },
        { date: "2026-01-15", process: "Trimming", erp_code: "G8X-013-103", defect: "Delamination", qty: 5 },
        { date: "2026-01-18", process: "Painting", erp_code: "G8X-013-103", defect: "Dust / Dirt inclusion", qty: 15 },
        { date: "2026-01-20", process: "Painting", erp_code: "G8X-013-103", defect: "Orange peel", qty: 10 },
        
        { date: "2026-02-10", process: "Layup", erp_code: "G8X-013-103", defect: "Void / Air bubble", qty: 6 },
        { date: "2026-02-12", process: "Painting", erp_code: "G8X-013-103", defect: "Dust / Dirt inclusion", qty: 14 },
        
        { date: "2026-01-10", process: "Layup", erp_code: "G8X-011-102", defect: "Void / Air bubble", qty: 14 },
        { date: "2026-01-12", process: "Painting", erp_code: "G8X-011-102", defect: "Dust / Dirt inclusion", qty: 22 },
        { date: "2026-01-15", process: "Painting", erp_code: "G8X-011-102", defect: "Orange peel", qty: 16 },
        { date: "2026-01-18", process: "Polishing", erp_code: "G8X-011-102", defect: "Burn through", qty: 8 },
        { date: "2026-01-20", process: "Gluing", erp_code: "G8X-011-102", defect: "Adhesion failure", qty: 10 }
    ],
    scrap_inven: [
        // 2025 Inputs
        { date: "2025-01-01", erp_code: "G8X-013-103", input_qty: 1200 },
        { date: "2025-02-01", erp_code: "G8X-013-103", input_qty: 1300 },
        { date: "2025-01-01", erp_code: "G8X-011-102", input_qty: 600 },
        { date: "2025-02-01", erp_code: "G8X-011-102", input_qty: 650 },

        // 2026 Inputs
        { date: "2026-01-01", erp_code: "G8X-013-103", input_qty: 1400 },
        { date: "2026-02-01", erp_code: "G8X-013-103", input_qty: 1500 },
        { date: "2026-03-01", erp_code: "G8X-013-103", input_qty: 1600 },
        
        { date: "2026-01-01", erp_code: "G8X-011-102", input_qty: 700 },
        { date: "2026-02-01", erp_code: "G8X-011-102", input_qty: 750 },
        { date: "2026-03-01", erp_code: "G8X-011-102", input_qty: 800 }
    ]
};
