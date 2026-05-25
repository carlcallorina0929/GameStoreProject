const User = require("../models/userModel");
const Game = require("../models/gameModel");
const Order = require("../models/orderModel");
const Transaction = require("../models/transactionModel");

const getSummary = async (req, res) => {
  try {
    const [totalUsers, totalGames, totalOrders, totalRevenue] = await Promise.all([
      User.getTotalUsersCount(),
      Game.getTotalGamesCount(),
      Order.getTotalOrdersCount(),
      Transaction.getTotalRevenue(),
    ]);

    return res.json({
      totalUsers,
      totalGames,
      totalOrders,
      totalRevenue,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getCharts = async (req, res) => {
  try {
    const [salesVolume, topSellingGames, registrationTrends, topFreeGames] = await Promise.all([
      Transaction.getSalesVolumeOverTime(),
      Order.getTopSellingGames(10),
      User.getUserRegistrationTrends(),
      Game.getTopFreeGamesByLibrary(10),
    ]);

    return res.json({
      salesVolume,
      topSellingGames,
      registrationTrends,
      topFreeGames,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getSummary,
  getCharts,
};
