import test from 'tape'
import {buffer} from '../index.js'

test('buffer', function (t) {
  t.equal(buffer(''), '', 'should support an empty document')

  t.equal(buffer('a'), '<p>a</p>', 'should support a text line')

  t.equal(buffer('a\rb'), '<p>a\rb</p>', 'should not support CR as EOL')
  t.equal(buffer('a\nb'), '<p>a</p>\n<p>b</p>', 'should support LF as EOL')
  t.equal(
    buffer('a\r\nb'),
    '<p>a</p>\r\n<p>b</p>',
    'should support CRLF as EOL'
  )

  t.equal(buffer('a\r'), '<p>a\r</p>', 'should not support CR at EOF')
  t.equal(buffer('a\n'), '<p>a</p>\n', 'should support a LF at EOF')
  t.equal(buffer('a\r\n'), '<p>a</p>\r\n', 'should support a CRLF at EOF')

  t.equal(
    buffer('<&'),
    '<p>&lt;&amp;</p>',
    'should encode certain HTML syntax characters in text'
  )

  t.equal(
    buffer('a\n\n'),
    '<p>a</p>\n<br />\n',
    'should support blank lines for `<br />`s'
  )

  t.equal(
    buffer('>'),
    '<blockquote></blockquote>',
    'should support empty quotes'
  )
  t.equal(
    buffer('>a'),
    '<blockquote>\n<p>a</p>\n</blockquote>',
    'should support quotes'
  )

  t.equal(
    buffer('> a'),
    '<blockquote>\n<p>a</p>\n</blockquote>',
    'should support some whitespace in quotes'
  )

  t.equal(
    buffer('>\t \ta'),
    '<blockquote>\n<p>a</p>\n</blockquote>',
    'should support lots of whitespace in quotes'
  )

  t.equal(
    buffer('><&'),
    '<blockquote>\n<p><&</p>\n</blockquote>',
    'should encode certain HTML syntax characters in quotes'
  )

  t.equal(buffer('='), '<p>=</p>', 'should not support a link w/ only a `=`')

  t.equal(
    buffer('=>'),
    '<div><a href=""></a></div>',
    'should support an empty link'
  )

  t.equal(
    buffer('=> \t'),
    '<div><a href=""></a></div>',
    'should support whitespace after the link sequence'
  )

  t.equal(
    buffer('=>a'),
    '<div><a href="a"></a></div>',
    'should support a URL after the link sequence'
  )

  t.equal(
    buffer('=> \ta'),
    '<div><a href="a"></a></div>',
    'should support a URL after whitespace after the link sequence (1)'
  )

  t.equal(
    buffer('=>\t a'),
    '<div><a href="a"></a></div>',
    'should support a URL after whitespace after the link sequence (2)'
  )

  t.equal(
    buffer('=>\t\ta'),
    '<div><a href="a"></a></div>',
    'should support a URL after whitespace after the link sequence (3)'
  )

  t.equal(
    buffer('=> a '),
    '<div><a href="a"></a></div>',
    'should support whitespace after a URL'
  )

  t.equal(
    buffer('=> a b'),
    '<div><a href="a">b</a></div>',
    'should support text after whitespace after a URL'
  )

  t.equal(
    buffer('=>a \tb'),
    '<div><a href="a">b</a></div>',
    'should support whitespace between URL and text (1)'
  )

  t.equal(
    buffer('=>a\t b'),
    '<div><a href="a">b</a></div>',
    'should support whitespace between URL and text (2)'
  )

  t.equal(
    buffer('=>a\t\tb'),
    '<div><a href="a">b</a></div>',
    'should support whitespace between URL and text (3)'
  )

  t.equal(
    buffer('=> index.html'),
    '<div><a href="index.html"></a></div>',
    'should support relative URLs'
  )

  t.equal(
    buffer('=> #a:b'),
    '<div><a href="#a:b"></a></div>',
    'should support fragment URLs'
  )

  t.equal(
    buffer('=> ?a:b'),
    '<div><a href="?a:b"></a></div>',
    'should support search URLs'
  )

  t.equal(
    buffer('=> /a:b'),
    '<div><a href="/a:b"></a></div>',
    'should support absolute URLs'
  )

  t.equal(
    buffer('=> //a:b'),
    '<div><a href="//a:b"></a></div>',
    'should support URLs relative to the current protocol'
  )

  t.equal(
    buffer('=> http://a.b'),
    '<div><a href="http://a.b"></a></div>',
    'should support HTTP URLs'
  )
  t.equal(
    buffer('=> https://a.b'),
    '<div><a href="https://a.b"></a></div>',
    'should support HTTPS URLs'
  )
  t.equal(
    buffer('=> javascript:alert(1)'),
    '<div><a href=""></a></div>',
    'should *not* support javascript URLs by default'
  )

  t.equal(
    buffer('=> 💩.html'),
    '<div><a href="%F0%9F%92%A9.html"></a></div>',
    'should support non-ascii characters in URLs'
  )

  t.equal(
    buffer('=> a%b.c'),
    '<div><a href="a%25b.c"></a></div>',
    'should support unencoded percentages in URLs'
  )

  t.equal(
    buffer('=> a%20b.c'),
    '<div><a href="a%20b.c"></a></div>',
    'should support encoded percentages in URLs'
  )

  t.equal(
    buffer('=> \u0160'),
    '<div><a href="%C5%A0"></a></div>',
    'should support non-ascii characters in URLs'
  )

  t.equal(
    buffer('=> foo\uDBFFbar'),
    '<div><a href="foo%EF%BF%BDbar"></a></div>',
    'should replace lone surrogates w/ replacement characters'
  )

  t.equal(
    buffer('=> >&'),
    '<div><a href="%3E&amp;"></a></div>',
    'should encode certain HTML syntax characters in `href`s'
  )

  t.equal(buffer('#'), '<h1></h1>', 'should support an empty heading')

  t.equal(buffer('##'), '<h2></h2>', 'should support an empty heading (rank 2)')

  t.equal(
    buffer('###'),
    '<h3></h3>',
    'should support an empty heading (rank 3)'
  )

  t.equal(
    buffer('####'),
    '<h3>#</h3>',
    'should not support an heading (rank 4)'
  )

  t.equal(
    buffer('# \t'),
    '<h1></h1>',
    'should support whitespace after heading sequence'
  )

  t.equal(
    buffer('#a'),
    '<h1>a</h1>',
    'should support no whitespace after heading sequence'
  )

  t.equal(
    buffer('##\ta'),
    '<h2>a</h2>',
    'should support whitespace and text after heading sequence'
  )

  t.equal(
    buffer('```'),
    '<pre></pre>',
    'should support an empty pre toggle line'
  )

  t.equal(
    buffer('```asd'),
    '<pre><code class="language-asd"></code></pre>',
    'should support a pre alt'
  )

  t.equal(
    buffer('```\n<&'),
    '<pre>&lt;&amp;</pre>',
    'should encode certain HTML syntax characters in pre'
  )

  t.equal(
    buffer('```a>&c'),
    '<pre><code class="language-a&gt;&amp;c"></code></pre>',
    'should encode certain HTML syntax characters in `alt`s'
  )

  t.equal(
    buffer('```a\n<&'),
    '<pre><code class="language-a">&lt;&amp;</code></pre>',
    'should encode certain HTML syntax characters in pre with `alt`'
  )

  t.equal(buffer('```\na'), '<pre>a</pre>', 'should support pre line')

  t.equal(
    buffer('```\na\n\nb\r\nc'),
    '<pre>a\n\nb\r\nc</pre>',
    'should support pre lines'
  )

  t.equal(
    buffer('```a\nb\n\nc\r\nd'),
    '<pre><code class="language-a">b\n\nc\r\nd</code></pre>',
    'should support pre w/ alt lines'
  )

  t.equal(
    buffer('```\n```'),
    '<pre></pre>',
    'should support two pre toggle lines'
  )

  t.equal(
    buffer('```\n```a'),
    '<pre></pre>',
    'should support (ignore) an alt on the closing pre toggle line'
  )

  t.equal(
    buffer('a\n```\nb\n```\nc'),
    '<p>a</p>\n<pre>b\n</pre>\n<p>c</p>',
    'should support text and pre and pre toggle lines'
  )

  t.equal(
    buffer('a\n```b\nc\n```\nd'),
    '<p>a</p>\n<pre><code class="language-b">c\n</code></pre>\n<p>d</p>',
    'should support text and pre and pre toggle w/ alt lines'
  )

  t.equal(
    buffer('```a\n\n\nb\n\n```'),
    '<pre><code class="language-a">\n\nb\n\n</code></pre>',
    'should not support hard breaks in pre'
  )

  t.equal(buffer('*'), '<ul>\n<li></li>\n</ul>', 'should support an empty list')

  t.equal(
    buffer('* '),
    '<ul>\n<li></li>\n</ul>',
    'should support an empty list w/ whitespace'
  )

  t.equal(buffer('*a'), '<p>*a</p>', 'should not support a list w/o whitespace')

  t.equal(
    buffer('* a'),
    '<ul>\n<li>a</li>\n</ul>',
    'should support a list item w/ whitespace'
  )

  t.equal(
    buffer('a\n* b'),
    '<p>a</p>\n<ul>\n<li>b</li>\n</ul>',
    'should support a text line and then a list'
  )

  t.equal(
    buffer('* a\n* b'),
    '<ul>\n<li>a</li>\n<li>b</li>\n</ul>',
    'should support multiple list items'
  )

  t.equal(
    buffer('* a\n*\n* \n* b'),
    '<ul>\n<li>a</li>\n<li></li>\n<li></li>\n<li>b</li>\n</ul>',
    'should support many list items'
  )

  t.equal(
    buffer('* a\n\n'),
    '<ul>\n<li>a</li>\n</ul>\n<br />\n',
    'should support a hard break directly after a list'
  )

  t.equal(
    buffer('* a\n\n* b'),
    '<ul>\n<li>a</li>\n</ul>\n<br />\n<ul>\n<li>b</li>\n</ul>',
    'should support a hard break between two lists'
  )

  t.equal(
    buffer('* a\n```b\nc\nd'),
    '<ul>\n<li>a</li>\n</ul>\n<pre><code class="language-b">c\nd</code></pre>',
    'should not support pre after lists'
  )

  t.equal(
    buffer('* a\n\n> b\n* c\nd\n* e\n* b\n# f'),
    [
      '<ul>',
      '<li>a</li>',
      '</ul>',
      '<br />',
      '<blockquote>',
      '<p>b</p>',
      '</blockquote>',
      '<ul>',
      '<li>c</li>',
      '</ul>',
      '<p>d</p>',
      '<ul>',
      '<li>e</li>',
      '<li>b</li>',
      '</ul>',
      '<h1>f</h1>'
    ].join('\n'),
    'all together now'
  )

  t.end()
})
