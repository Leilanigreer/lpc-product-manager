// app/components/ShapeSelector/constants.js
/** Column widths for shape grid rows (embroidery column removed; space given to style + color designation). */
export const COLUMN_WIDTHS = {
  shapeColumn: "125px", // shape only (weight capture disabled)
  /** Wide enough for up to three 80px dropzones + view labels + gaps (putter shapes). */
  imagesColumn: "320px",
  styleColumn: "300px",
  /**
   * Fixed-width slot for the contextual leather phrase (e.g. ": Diamonds are", ": Fat Middle is").
   * Splitting this out of the colorDesignation column keeps the Named Leather dropdown anchored
   * under its header even when the phrase text varies per row.
   */
  leatherPhraseColumn: "150px",
  colorDesignationColumn: "220px",
};