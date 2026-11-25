import test from 'node:test';
import assert from 'node:assert/strict';
import {applyPatches} from '../editor-patches.mjs';
const cases=[
  [
    "valid patch",
    "İşlemin gerçekleştirilmesi gerekir.",
    [
      {
        "index": 0,
        "before": "İşlemin gerçekleştirilmesi",
        "after": "İşlemi yapmak",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    true,
    "İşlemi yapmak gerekir."
  ],
  [
    "no changes",
    "Doğru metin.",
    [],
    true,
    "Doğru metin."
  ],
  [
    "heading locked",
    "# Başlık\n\nMetin mevcut değildir.",
    [
      {
        "index": 0,
        "before": "Başlık",
        "after": "Yeni",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    false
  ],
  [
    "body after heading",
    "# Başlık\n\nMetin mevcut değildir.",
    [
      {
        "index": 2,
        "before": "mevcut değildir",
        "after": "yok",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    true,
    "# Başlık\n\nMetin yok."
  ],
  [
    "ambiguous",
    "Test test test.",
    [
      {
        "index": 0,
        "before": "test",
        "after": "deneme",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    false
  ],
  [
    "missing anchor",
    "Metin.",
    [
      {
        "index": 0,
        "before": "Yok",
        "after": "Var",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    false
  ],
  [
    "overlap",
    "Uzun ve ağır ifade.",
    [
      {
        "index": 0,
        "before": "Uzun ve",
        "after": "Kısa",
        "reason": "Gereksiz adlaştırma."
      },
      {
        "index": 0,
        "before": "ve ağır",
        "after": "ve sade",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    false
  ],
  [
    "number",
    "Ücret 900 TL olarak belirlenmiştir.",
    [
      {
        "index": 0,
        "before": "900 TL",
        "after": "950 TL",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    false
  ],
  [
    "number order",
    "A 900, B 1200 TL.",
    [
      {
        "index": 0,
        "before": "A 900, B 1200",
        "after": "A 1200, B 900",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    false
  ],
  [
    "link",
    "[Kılavuz](/help) mevcut değildir.",
    [
      {
        "index": 0,
        "before": "/help",
        "after": "/new",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    false
  ],
  [
    "link retained",
    "[Kılavuz](/help) mevcut değildir.",
    [
      {
        "index": 0,
        "before": "mevcut değildir",
        "after": "yok",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    true,
    "[Kılavuz](/help) yok."
  ],
  [
    "quote",
    "“Özgün söz” dedi.",
    [
      {
        "index": 0,
        "before": "Özgün söz",
        "after": "Yeni söz",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    false
  ],
  [
    "table locked",
    "| A | B |\n|---|---|\n| 1 | 2 |",
    [
      {
        "index": 0,
        "before": "A",
        "after": "C",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    false
  ],
  [
    "fence lock",
    "```js\n\nfoo()\n\n```\n\nİşlem mevcut değildir.",
    [
      {
        "index": 2,
        "before": "foo()",
        "after": "bar()",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    false
  ],
  [
    "after fence",
    "```js\n\nfoo()\n\n```\n\nİşlem mevcut değildir.",
    [
      {
        "index": 6,
        "before": "mevcut değildir",
        "after": "yok",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    true,
    "```js\n\nfoo()\n\n```\n\nİşlem yok."
  ],
  [
    "line break",
    "Bir cümle.",
    [
      {
        "index": 0,
        "before": "Bir",
        "after": "İlk\n\nBaşka",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    false
  ],
  [
    "partial word",
    "Türkiye'de çalışıyor.",
    [
      {
        "index": 0,
        "before": "Türk",
        "after": "İngiliz",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    false
  ],
  [
    "unicode format",
    "Metin ​ burada.",
    [
      {
        "index": 0,
        "before": "​ burada",
        "after": "burada",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    false
  ],
  [
    "whole paragraph removal",
    "Gereksiz giriş.",
    [
      {
        "index": 0,
        "before": "Gereksiz giriş.",
        "after": "",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    false
  ],
  [
    "all or nothing",
    "Doğru ifade.\n\nİkinci ifade.",
    [
      {
        "index": 0,
        "before": "Doğru ifade",
        "after": "İlk ifade",
        "reason": "Gereksiz adlaştırma."
      },
      {
        "index": 2,
        "before": "yok",
        "after": "var",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    false
  ],
  [
    "paragraphs",
    "İşlem mevcut değildir.\n \nSonuç mevcut değildir.",
    [
      {
        "index": 0,
        "before": "mevcut değildir",
        "after": "yok",
        "reason": "Gereksiz adlaştırma."
      },
      {
        "index": 2,
        "before": "mevcut değildir",
        "after": "yok",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    true,
    "İşlem yok.\n \nSonuç yok."
  ],
  [
    "list locked",
    "- İlk öğe\n- İkinci öğe",
    [
      {
        "index": 0,
        "before": "İlk",
        "after": "Yeni",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    false
  ],
  [
    "new structure",
    "Düz metin.",
    [
      {
        "index": 0,
        "before": "Düz metin.",
        "after": "# Başlık",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    false
  ],
  [
    "inline code",
    "Komut `npm test` çalıştırılır.",
    [
      {
        "index": 0,
        "before": "npm test",
        "after": "npm build",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    false
  ],
  [
    "semantic gap",
    "Henüz tamamlanmadı.",
    [
      {
        "index": 0,
        "before": "tamamlanmadı",
        "after": "tamamlandı",
        "reason": "Gereksiz adlaştırma."
      }
    ],
    true,
    "Henüz tamamlandı."
  ],
  [
    "long fence lock",
    "````md\n\n```\n\nGizli metin.\n\n```\n\n````\n\nİşlem mevcut değildir.",
    [
      {
        "index": 4,
        "before": "Gizli",
        "after": "Yeni",
        "reason": "Test"
      }
    ],
    false,
    null
  ],
  [
    "different fence lock",
    "~~~md\n\n```\n\nGizli metin.\n\n~~~\n\nİşlem mevcut değildir.",
    [
      {
        "index": 4,
        "before": "Gizli",
        "after": "Yeni",
        "reason": "Test"
      }
    ],
    false,
    null
  ]
];
for(const [name,source,patches,valid,output] of cases)test(name,()=>{const r=applyPatches(source,patches);assert.equal(r.valid,valid);assert.equal(r.output,valid?output:source);});
