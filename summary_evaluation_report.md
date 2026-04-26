# Báo cáo đánh giá tóm tắt reference-free (4 LLM)

- Nguồn dữ liệu: 50 record trong finalData.json
- Cách tách tập: 25 record đầu (chi tiết), 25 record tiếp theo (tổng hợp)
- Số mô hình: 4

## 1) Metric sử dụng (reference-free)

- KWC (Keyword Coverage): độ phủ từ khóa quan trọng của bài gốc trong bản tóm tắt.
- ECR (Entity Consistency Rate): tỷ lệ thực thể/số liệu trong tóm tắt có thể đối chiếu trong bài gốc (proxy cho tính đúng sự thật).
- CAS (Compression Appropriateness Score): độ phù hợp về mức độ nén (tỷ lệ độ dài) và đúng yêu cầu 3-5 câu.
- NRS (Non-Redundancy Score): độ không lặp nội dung (dựa trên trigram trùng lặp).
- FCS (Format Compliance Score): tuân thủ định dạng output (không chèn markdown, không mở đầu meta, không xuống dòng bất thường).

- Tổng điểm (0-1):
  `Quality = 0.30*KWC + 0.30*ECR + 0.20*CAS + 0.10*NRS + 0.10*FCS`

## 2) Kết quả chi tiết - 25 record đầu (tác vụ tóm tắt lẻ)

| Record | gemma-4 | hf.co/unsloth/Ministral-3-8B-Instruct-2512-GGUF:Q4_K_M | hf.co/unsloth/granite-4.0-h-tiny-GGUF:Q4_K_M | llama3.1:8b-instruct-q4_K_M | Winner                                                 |
| -----: | ------: | -----------------------------------------------------: | -------------------------------------------: | --------------------------: | ------------------------------------------------------ |
|      1 |    92.0 |                                                   77.1 |                                         87.2 |                        87.8 | gemma-4                                                |
|      2 |    90.9 |                                                   91.8 |                                         87.2 |                        88.4 | hf.co/unsloth/Ministral-3-8B-Instruct-2512-GGUF:Q4_K_M |
|      3 |    83.6 |                                                   79.1 |                                         83.0 |                        81.8 | gemma-4                                                |
|      4 |    96.2 |                                                   90.1 |                                         92.0 |                        87.7 | gemma-4                                                |
|      5 |    90.0 |                                                   79.7 |                                         84.1 |                        93.8 | llama3.1:8b-instruct-q4_K_M                            |
|      6 |    82.5 |                                                   74.5 |                                         82.7 |                        91.8 | llama3.1:8b-instruct-q4_K_M                            |
|      7 |    84.9 |                                                   79.8 |                                         84.3 |                        80.0 | gemma-4                                                |
|      8 |    91.8 |                                                   89.3 |                                         93.1 |                        84.9 | hf.co/unsloth/granite-4.0-h-tiny-GGUF:Q4_K_M           |
|      9 |    90.5 |                                                   86.7 |                                         92.7 |                        81.8 | hf.co/unsloth/granite-4.0-h-tiny-GGUF:Q4_K_M           |
|     10 |    93.9 |                                                   86.0 |                                         94.4 |                        95.3 | llama3.1:8b-instruct-q4_K_M                            |
|     11 |    86.2 |                                                   79.4 |                                         78.3 |                        83.7 | gemma-4                                                |
|     12 |    92.1 |                                                   81.1 |                                         98.5 |                        90.1 | hf.co/unsloth/granite-4.0-h-tiny-GGUF:Q4_K_M           |
|     13 |    95.7 |                                                   93.0 |                                         91.3 |                        94.4 | gemma-4                                                |
|     14 |    85.3 |                                                   83.5 |                                         76.9 |                        80.0 | gemma-4                                                |
|     15 |    89.9 |                                                   87.1 |                                         88.5 |                        86.2 | gemma-4                                                |
|     16 |    85.3 |                                                   80.9 |                                         85.1 |                        87.7 | llama3.1:8b-instruct-q4_K_M                            |
|     17 |    92.2 |                                                   82.7 |                                         87.6 |                        90.1 | gemma-4                                                |
|     18 |    87.5 |                                                   76.4 |                                         86.4 |                        96.9 | llama3.1:8b-instruct-q4_K_M                            |
|     19 |    80.4 |                                                   77.1 |                                         71.4 |                        65.1 | gemma-4                                                |
|     20 |    73.0 |                                                   66.3 |                                         80.3 |                        74.8 | hf.co/unsloth/granite-4.0-h-tiny-GGUF:Q4_K_M           |
|     21 |    91.6 |                                                   79.7 |                                         89.7 |                        95.8 | llama3.1:8b-instruct-q4_K_M                            |
|     22 |    92.0 |                                                   72.1 |                                         81.5 |                        87.0 | gemma-4                                                |
|     23 |    80.9 |                                                   74.4 |                                         81.4 |                        93.0 | llama3.1:8b-instruct-q4_K_M                            |
|     24 |    87.5 |                                                   80.8 |                                         68.2 |                        86.5 | gemma-4                                                |
|     25 |    79.8 |                                                   83.1 |                                         80.8 |                        74.5 | hf.co/unsloth/Ministral-3-8B-Instruct-2512-GGUF:Q4_K_M |

### Trung bình 25 record đầu

| Model                                                  | Quality |   KWC |   ECR |   CAS |   NRS |    FCS | Wins |
| ------------------------------------------------------ | ------: | ----: | ----: | ----: | ----: | -----: | ---: |
| gemma-4                                                |   87.8% | 76.6% | 98.6% | 77.2% | 98.4% | 100.0% |   12 |
| llama3.1:8b-instruct-q4_K_M                            |   86.4% | 71.0% | 99.8% | 78.6% | 97.7% |  96.2% |    7 |
| hf.co/unsloth/granite-4.0-h-tiny-GGUF:Q4_K_M           |   85.1% | 78.6% | 99.0% | 60.9% | 96.2% | 100.0% |    4 |
| hf.co/unsloth/Ministral-3-8B-Instruct-2512-GGUF:Q4_K_M |   81.3% | 84.4% | 97.2% | 48.5% | 98.3% |  72.4% |    2 |

## 3) Đánh giá tổng hợp - 25 record còn lại (tác vụ tổng hợp)

| Model                                                  | Quality |   KWC |   ECR |  CAS |   NRS |   FCS | Wins |
| ------------------------------------------------------ | ------: | ----: | ----: | ---: | ----: | ----: | ---: |
| hf.co/unsloth/granite-4.0-h-tiny-GGUF:Q4_K_M           |   77.0% | 94.6% | 98.7% | 6.4% | 90.4% | 86.4% |   16 |
| gemma-4                                                |   75.9% | 95.2% | 97.9% | 0.0% | 96.0% | 83.4% |    9 |
| llama3.1:8b-instruct-q4_K_M                            |   75.3% | 94.8% | 97.9% | 0.1% | 90.1% | 85.0% |    0 |
| hf.co/unsloth/Ministral-3-8B-Instruct-2512-GGUF:Q4_K_M |   73.0% | 96.0% | 94.5% | 0.0% | 94.3% | 64.6% |    0 |

## 4) Nhận xét

- Top model trên 25 record đầu (tóm tắt lẻ): **gemma-4** (87.8%).
- Top model trên 25 record sau (tổng hợp): **hf.co/unsloth/granite-4.0-h-tiny-GGUF:Q4_K_M** (77.0%).
- KWC và ECR là hai thành phần chi phối chất lượng: model nào giữ được độ bao phủ nội dung + độ nhất quán thực thể sẽ ổn định hơn.
- Các model có CAS thấp thường do tóm tắt quá dài/quá ngắn hoặc không đạt ngưỡng 3-5 câu theo yêu cầu đề bài.
- Các output chèn câu dẫn nhập/meta (ví dụ "Dưới đây là tóm tắt") bị trừ FCS, làm giảm điểm tổng.

## 5) Chốt model cuối cùng cho 2 tác vụ

- Tác vụ tóm tắt lẻ (25 record đầu): model tốt nhất là **gemma-4**.
- Tác vụ tổng hợp (25 record sau): model tốt nhất là **hf.co/unsloth/granite-4.0-h-tiny-GGUF:Q4_K_M**.
- Nếu buộc chọn **một model duy nhất** để vận hành cả 2 tác vụ, model đề xuất là **gemma-4**.

Lý do chọn model duy nhất:

- Điểm trung bình gộp 2 tác vụ của **gemma-4** là cao nhất: (87.8% + 75.9%) / 2 = **81.9%**.
- **gemma-4** có độ ổn định cao về định dạng (FCS) và mức độ nén phù hợp (CAS) ở tập tóm tắt lẻ, giúp giảm rủi ro khi triển khai thực tế.
- Chênh lệch với model dẫn đầu ở tác vụ tổng hợp không lớn, nhưng độ ổn định tổng thể tốt hơn khi dùng một model chung.

## 6) Nguồn tham chiếu / reference cho phương pháp metric

Lưu ý: Bộ chỉ số trong báo cáo là bộ **proxy reference-free thực dụng** (không dùng gold summary). Các metric được thiết kế dựa trên tinh thần của các hướng đánh giá trong tài liệu dưới đây:

1. Fabbri, A. R., et al. (2021). **SummEval: Re-evaluating Summarization Evaluation**. _Transactions of the ACL_.  
   Liên quan: khung đánh giá chất lượng tóm tắt theo nhiều chiều (coherence, consistency, fluency, relevance).

2. Kryściński, W., et al. (2020). **Evaluating the Factual Consistency of Abstractive Text Summarization**. _EMNLP_.  
   Liên quan: đánh giá tính nhất quán sự thật của tóm tắt với nguồn (tinh thần cho ECR).

3. Deutsch, D., et al. (2021). **QAEval: Summarization Asks for Fact-based Evaluation via Question Answering**. _TACL/ACL findings line of work_.  
   Liên quan: đánh giá factuality dựa trên khả năng truy hồi thông tin từ văn bản nguồn.

4. Gao, T., et al. (2023). **G-EVAL: NLG Evaluation using GPT-4 with Better Human Alignment**.  
   Liên quan: hướng đánh giá không phụ thuộc hoàn toàn vào n-gram overlap, ưu tiên chất lượng ngữ nghĩa và tính hữu dụng thực tế.

5. Peyrard, M. (2019). **A Simple Theoretical Model of Importance for Summarization** (và các hướng coverage-based evaluation).  
   Liên quan: nền tảng lý thuyết cho các chỉ số bao phủ nội dung (tinh thần cho KWC).

Ánh xạ metric dùng trong báo cáo với hướng nghiên cứu:

- KWC: nhóm coverage/relevance.
- ECR: nhóm factual consistency / faithfulness.
- CAS: nhóm compression & requirement compliance.
- NRS: nhóm redundancy penalty thường dùng trong tối ưu tóm tắt.
- FCS: nhóm format/instruction following (mang tính vận hành thực tế trong pipeline).

## 7) Giới hạn phương pháp

- Đây là đánh giá reference-free, không có "gold summary" để so độ khớp ngữ nghĩa tuyệt đối.
- ECR là proxy theo đối chiếu thực thể/số liệu bằng string matching, không thay thế hoàn toàn cho fact-checking bằng tri thức ngoài.
- Báo cáo phù hợp cho so sánh tương đối giữa các model trong cùng bộ dữ liệu.
