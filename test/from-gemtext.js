import test from 'tape'
import {fromGemtext} from '../index.js'

test('fromGemtext', (t) => {
  t.deepEqual(
    fromGemtext(''),
    {
      type: 'root',
      children: [],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 1, column: 1, offset: 0}
      }
    },
    'should support an empty document'
  )

  t.deepEqual(
    fromGemtext('a\r\nb\nc'),
    {
      type: 'root',
      children: [
        {
          type: 'text',
          value: 'a',
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 2, offset: 1}
          }
        },
        {
          type: 'text',
          value: 'b',
          position: {
            start: {line: 2, column: 1, offset: 3},
            end: {line: 2, column: 2, offset: 4}
          }
        },
        {
          type: 'text',
          value: 'c',
          position: {
            start: {line: 3, column: 1, offset: 5},
            end: {line: 3, column: 2, offset: 6}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 3, column: 2, offset: 6}
      }
    },
    'should support text'
  )

  t.deepEqual(
    fromGemtext('a\n\n'),
    {
      type: 'root',
      children: [
        {
          type: 'text',
          value: 'a',
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 2, offset: 1}
          }
        },
        {
          type: 'break',
          position: {
            start: {line: 2, column: 1, offset: 2},
            end: {line: 3, column: 1, offset: 3}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 3, column: 1, offset: 3}
      }
    },
    'should support breaks'
  )

  t.deepEqual(
    fromGemtext('### a\n##b\n#'),
    {
      type: 'root',
      children: [
        {
          type: 'heading',
          rank: 3,
          value: 'a',
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 6, offset: 5}
          }
        },
        {
          type: 'heading',
          rank: 2,
          value: 'b',
          position: {
            start: {line: 2, column: 1, offset: 6},
            end: {line: 2, column: 4, offset: 9}
          }
        },
        {
          type: 'heading',
          rank: 1,
          value: '',
          position: {
            start: {line: 3, column: 1, offset: 10},
            end: {line: 3, column: 2, offset: 11}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 3, column: 2, offset: 11}
      }
    },
    'should support headings'
  )

  t.deepEqual(
    fromGemtext('=\n=>\n=>a\n=> b\n=>c d\n=> e\t\tf'),
    {
      type: 'root',
      children: [
        {
          type: 'text',
          value: '=',
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 2, offset: 1}
          }
        },
        {
          type: 'link',
          url: null,
          value: '',
          position: {
            start: {line: 2, column: 1, offset: 2},
            end: {line: 2, column: 3, offset: 4}
          }
        },
        {
          type: 'link',
          url: 'a',
          value: '',
          position: {
            start: {line: 3, column: 1, offset: 5},
            end: {line: 3, column: 4, offset: 8}
          }
        },
        {
          type: 'link',
          url: 'b',
          value: '',
          position: {
            start: {line: 4, column: 1, offset: 9},
            end: {line: 4, column: 5, offset: 13}
          }
        },
        {
          type: 'link',
          url: 'c',
          value: 'd',
          position: {
            start: {line: 5, column: 1, offset: 14},
            end: {line: 5, column: 6, offset: 19}
          }
        },
        {
          type: 'link',
          url: 'e',
          value: 'f',
          position: {
            start: {line: 6, column: 1, offset: 20},
            end: {line: 6, column: 8, offset: 27}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 6, column: 8, offset: 27}
      }
    },
    'should support links'
  )

  t.deepEqual(
    fromGemtext('*\n* \n*a\n* b\n\nc\n* d\n* e\n*\nf'),
    {
      type: 'root',
      children: [
        {
          type: 'list',
          children: [
            {
              type: 'listItem',
              value: '',
              position: {
                start: {line: 1, column: 1, offset: 0},
                end: {line: 1, column: 2, offset: 1}
              }
            },
            {
              type: 'listItem',
              value: '',
              position: {
                start: {line: 2, column: 1, offset: 2},
                end: {line: 2, column: 3, offset: 4}
              }
            }
          ],
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 2, column: 3, offset: 4}
          }
        },
        {
          type: 'text',
          value: '*a',
          position: {
            start: {line: 3, column: 1, offset: 5},
            end: {line: 3, column: 3, offset: 7}
          }
        },
        {
          type: 'list',
          children: [
            {
              type: 'listItem',
              value: 'b',
              position: {
                start: {line: 4, column: 1, offset: 8},
                end: {line: 4, column: 4, offset: 11}
              }
            }
          ],
          position: {
            start: {line: 4, column: 1, offset: 8},
            end: {line: 4, column: 4, offset: 11}
          }
        },
        {
          type: 'break',
          position: {
            start: {line: 5, column: 1, offset: 12},
            end: {line: 6, column: 1, offset: 13}
          }
        },
        {
          type: 'text',
          value: 'c',
          position: {
            start: {line: 6, column: 1, offset: 13},
            end: {line: 6, column: 2, offset: 14}
          }
        },
        {
          type: 'list',
          children: [
            {
              type: 'listItem',
              value: 'd',
              position: {
                start: {line: 7, column: 1, offset: 15},
                end: {line: 7, column: 4, offset: 18}
              }
            },
            {
              type: 'listItem',
              value: 'e',
              position: {
                start: {line: 8, column: 1, offset: 19},
                end: {line: 8, column: 4, offset: 22}
              }
            },
            {
              type: 'listItem',
              value: '',
              position: {
                start: {line: 9, column: 1, offset: 23},
                end: {line: 9, column: 2, offset: 24}
              }
            }
          ],
          position: {
            start: {line: 7, column: 1, offset: 15},
            end: {line: 9, column: 2, offset: 24}
          }
        },
        {
          type: 'text',
          value: 'f',
          position: {
            start: {line: 10, column: 1, offset: 25},
            end: {line: 10, column: 2, offset: 26}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 10, column: 2, offset: 26}
      }
    },
    'should support lists'
  )

  t.deepEqual(
    fromGemtext('```'),
    {
      type: 'root',
      children: [
        {
          type: 'pre',
          alt: null,
          value: '',
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 4, offset: 3}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 1, column: 4, offset: 3}
      }
    },
    'should support empty unclosed `pre`'
  )

  t.deepEqual(
    fromGemtext('```x'),
    {
      type: 'root',
      children: [
        {
          type: 'pre',
          alt: 'x',
          value: '',
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 5, offset: 4}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 1, column: 5, offset: 4}
      }
    },
    'should support empty unclosed `pre` w/ `alt`'
  )

  t.deepEqual(
    fromGemtext('```\na\nb\n\nc'),
    {
      type: 'root',
      children: [
        {
          type: 'pre',
          alt: null,
          value: 'a\nb\n\nc',
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 5, column: 2, offset: 10}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 5, column: 2, offset: 10}
      }
    },
    'should support filled unclosed `pre` w/o `alt`'
  )

  t.deepEqual(
    fromGemtext('```x\na\nb\n\nc'),
    {
      type: 'root',
      children: [
        {
          type: 'pre',
          alt: 'x',
          value: 'a\nb\n\nc',
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 5, column: 2, offset: 11}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 5, column: 2, offset: 11}
      }
    },
    'should support filled unclosed `pre` w/ `alt`'
  )

  t.deepEqual(
    fromGemtext('```\n```\na'),
    {
      type: 'root',
      children: [
        {
          type: 'pre',
          alt: null,
          value: '',
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 2, column: 4, offset: 7}
          }
        },
        {
          type: 'text',
          value: 'a',
          position: {
            start: {line: 3, column: 1, offset: 8},
            end: {line: 3, column: 2, offset: 9}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 3, column: 2, offset: 9}
      }
    },
    'should support empty closed `pre`'
  )

  t.deepEqual(
    fromGemtext('```\na\n\nb\n```\na'),
    {
      type: 'root',
      children: [
        {
          type: 'pre',
          alt: null,
          value: 'a\n\nb',
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 5, column: 4, offset: 12}
          }
        },
        {
          type: 'text',
          value: 'a',
          position: {
            start: {line: 6, column: 1, offset: 13},
            end: {line: 6, column: 2, offset: 14}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 6, column: 2, offset: 14}
      }
    },
    'should support filled closed `pre`'
  )

  t.deepEqual(
    fromGemtext('```a\nb\n```c\nd'),
    {
      type: 'root',
      children: [
        {
          type: 'pre',
          alt: 'a',
          value: 'b',
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 3, column: 5, offset: 11}
          }
        },
        {
          type: 'text',
          value: 'd',
          position: {
            start: {line: 4, column: 1, offset: 12},
            end: {line: 4, column: 2, offset: 13}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 4, column: 2, offset: 13}
      }
    },
    'should support filled closed `pre`'
  )

  t.deepEqual(
    fromGemtext('> a\n>b\n>'),
    {
      type: 'root',
      children: [
        {
          type: 'quote',
          value: 'a',
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 4, offset: 3}
          }
        },
        {
          type: 'quote',
          value: 'b',
          position: {
            start: {line: 2, column: 1, offset: 4},
            end: {line: 2, column: 3, offset: 6}
          }
        },
        {
          type: 'quote',
          value: '',
          position: {
            start: {line: 3, column: 1, offset: 7},
            end: {line: 3, column: 2, offset: 8}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 3, column: 2, offset: 8}
      }
    },
    'should support quotes'
  )

  t.end()
})
