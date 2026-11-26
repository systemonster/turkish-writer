import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Collectors;
import zemberek.morphology.TurkishMorphology;
import zemberek.morphology.analysis.SentenceWordAnalysis;
import zemberek.morphology.analysis.SingleAnalysis;
import zemberek.tokenization.TurkishSentenceExtractor;

class ZemberekDenetle {
    static String q(String text) {
        StringBuilder out = new StringBuilder("\"");
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (c == '"' || c == '\\') out.append('\\').append(c);
            else if (c < 32) out.append(String.format("\\u%04x", (int)c));
            else out.append(c);
        }
        return out.append('"').toString();
    }
    public static void main(String[] args) throws Exception {
        if (args.length != 1) throw new IllegalArgumentException("UTF-8 düz metin dosyası gerekli");
        Path path = Path.of(args[0]);
        if (!Files.isRegularFile(path) || Files.size(path) > 2 * 1024 * 1024) {
            throw new IllegalArgumentException("En çok 2 MiB düz dosya gerekli");
        }
        String text = Files.readString(path, StandardCharsets.UTF_8);
        TurkishMorphology morphology = TurkishMorphology.createWithDefaults();
        for (String sentence : TurkishSentenceExtractor.DEFAULT.fromDocument(text)) {
            var words = new java.util.ArrayList<String>();
            for (SentenceWordAnalysis word : morphology.analyzeAndDisambiguate(sentence)) {
                SingleAnalysis a = word.getBestAnalysis();
                String tags = a.getMorphemes().stream().map(m -> q(m.id)).collect(Collectors.joining(","));
                words.add("{\"token\":" + q(word.getWordAnalysis().getInput())
                    + ",\"lemma\":" + q(a.getDictionaryItem().lemma)
                    + ",\"stem\":" + q(a.getStem())
                    + ",\"pos\":" + q(a.getPos().toString())
                    + ",\"unknown\":" + a.isUnknown()
                    + ",\"morphemes\":[" + tags + "]}");
            }
            System.out.println("{\"sentence\":" + q(sentence) + ",\"tokens\":[" + String.join(",", words) + "]}");
        }
    }
}
