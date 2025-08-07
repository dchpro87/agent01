import { ask_for_confirmation } from "./ask-for-confirmation";
import { search_web } from "./search-web";
import { document_summarizer } from "./document-summarizer";
import { find_similar_docs } from "./find-similar-docs";
// export { ocr_pdf_agent } from "./ocr-pdf-agent";

export const tools = {
  ask_for_confirmation,
  search_web,
  document_summarizer,
  find_similar_docs,
};
