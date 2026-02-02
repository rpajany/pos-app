import Quotation from "../models/Quotation.js";

// CREATE
export const createQuotation = async (req, res) => {
  try {
    // Auto-generate Quote Number (Format: QID-001)
    const lastQuote = await Quotation.findOne().sort({ createdAt: -1 });
    let newNumber = 1;
    if (lastQuote && lastQuote.quoteNo) {
      const lastNum = parseInt(lastQuote.quoteNo.split("-")[1]);
      newNumber = lastNum + 1;
    }
    const quoteNo = `QID-${String(newNumber).padStart(3, "0")}`;

    const quotation = new Quotation({ ...req.body, quoteNo });
    await quotation.save();
    res.status(201).json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// READ ALL
// export const getAllQuotations = async (req, res) => {
//   try {
//     const quotes = await Quotation.find().sort({ createdAt: -1 });
//     res.json({ success: true, data: quotes });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

export const getAllQuotations = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) 
      };
    }

    const reports = await Quotation.find(query)
      .populate("customerId", "name")
      .sort({ date: -1 });

    // CRITICAL: Send 'reports' directly as the data
    res.json({ success: true, data: reports }); 
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// UPDATE
export const updateStatusComments = async (req, res) => {
  try {
    const { status, statusComment } = req.body;
    const updated = await Quotation.findByIdAndUpdate(
      req.params.id,
      { status, statusComment },
      { new: true }
    );
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE
export const updateQuotation = async (req, res) => {
  try {
    const quote = await Quotation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE
export const deleteQuotation = async (req, res) => {
try {
    const { id } = req.params;
    await Quotation.findByIdAndDelete(id);
    res.json({ success: true, message: "Quotation deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};