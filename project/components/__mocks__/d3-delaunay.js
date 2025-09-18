const Delaunay = {
  from: jest.fn().mockReturnThis(),
  voronoi: jest.fn(() => ({
    cellPolygon: jest.fn(() => [[0, 0], [10, 0], [10, 10], [0, 10]]),
  })),
};

module.exports = { Delaunay };
