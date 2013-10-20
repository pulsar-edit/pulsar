# This is a single-file version of Jim Weirich's Builder suite version 1.2.3, 
# including some very minor tweaks required to make it work with Ruby 1.6.8.
# Copyright 2004 by Jim Weirich (jim@weirichhouse.org).
# All rights reserved.
#
# Create XML markup easily.  All (well, almost all) methods sent to
# an XmlMarkup object will be translated to the equivalent XML
# markup.  Any method with a block will be treated as an XML markup
# tag with nested markup in the block.
#
# Examples will demonstrate this easier than words.  In the
# following, +xm+ is an +XmlMarkup+ object.
#
#   xm.em("emphasized")             # => <em>emphasized</em>
#   xm.em { xmm.b("emp & bold") }   # => <em><b>emph &amp; bold</b></em>
#   xm.a("A Link", "href"=>"http://onestepback.org")
#                                   # => <a href="http://onestepback.org">A Link</a>
#   xm.div { br }                    # => <div><br/></div>
#   xm.target("name"=>"compile", "option"=>"fast")
#                                   # => <target option="fast" name="compile"\>
#                                   # NOTE: order of attributes is not specified.
#
#   xm.instruct!                   # <?xml version="1.0" encoding="UTF-8"?>
#   xm.html {                      # <html>
#     xm.head {                    #   <head>
#       xm.title("History")        #     <title>History</title>
#     }                            #   </head>
#     xm.body {                    #   <body>
#       xm.comment! "HI"           #     <!-- HI -->
#       xm.h1("Header")            #     <h1>Header</h1>
#       xm.p("paragraph")          #     <p>paragraph</p>
#     }                            #   </body>
#   }                              # </html>
#


# blankslate.rb:

#!/usr/bin/env ruby
#--
# Copyright 2004 by Jim Weirich (jim@weirichhouse.org).
# All rights reserved.

# Permission is granted for use, copying, modification, distribution,
# and distribution of modified versions of this work as long as the
# above copyright notice is included.
#++

module Builder

  # BlankSlate provides an abstract base class with no predefined
  # methods (except for <tt>\_\_send__</tt> and <tt>\_\_id__</tt>).
  # BlankSlate is useful as a base class when writing classes that
  # depend upon <tt>method_missing</tt> (e.g. dynamic proxies).
  class BlankSlate
    class << self
      def hide(name)
	undef_method name if
	  instance_methods.include?(name.to_s) and
	  name !~ /^(__|instance_eval)/
      end
    end

    instance_methods.each { |m| hide(m) }
  end
end

# Since Ruby is very dynamic, methods added to the ancestors of
# BlankSlate <em>after BlankSlate is defined</em> will show up in the
# list of available BlankSlate methods.  We handle this by defining a hook in the Object and Kernel classes that will hide any defined 
module Kernel
  class << self
    alias_method :blank_slate_method_added, :method_added
    def method_added(name)
      blank_slate_method_added(name)
      return if self != Kernel
      Builder::BlankSlate.hide(name)
    end
  end
end

class Object
  class << self
    alias_method :blank_slate_method_added, :method_added
    def method_added(name)
      blank_slate_method_added(name)
      return if self != Object
      Builder::BlankSlate.hide(name)
    end
  end
end

# xmlbase.rb
module Builder

  # Generic error for builder
  class IllegalBlockError < RuntimeError; end

  # XmlBase is a base class for building XML builders.  See
  # Builder::XmlMarkup and Builder::XmlEvents for examples.
  class XmlBase < BlankSlate

    # Create an XML markup builder.
    #
    # out::     Object receiving the markup.1  +out+ must respond to
    #           <tt><<</tt>.
    # indent::  Number of spaces used for indentation (0 implies no
    #           indentation and no line breaks).
    # initial:: Level of initial indentation.
    #
    def initialize(indent=0, initial=0)
      @indent = indent
      @level  = initial
      @self = nil
    end
    
    # Create a tag named +sym+.  Other than the first argument which
    # is the tag name, the arguements are the same as the tags
    # implemented via <tt>method_missing</tt>.
    def tag!(sym, *args, &block)
      self.__send__(sym, *args, &block)
    end

    # Create XML markup based on the name of the method.  This method
    # is never invoked directly, but is called for each markup method
    # in the markup block.
    def method_missing(sym, *args, &block)
      text = nil
      attrs = nil
      sym = "#{sym}:#{args.shift}" if args.first.kind_of?(Symbol)
      args.each do |arg|
	case arg
	when Hash
	  attrs ||= {}
	  attrs.update(arg) # was merge!, which ruby 1.6.8 doesn't support
	else
	  text ||= ''
	  text << arg.to_s
	end
      end
      if block
	unless text.nil?
	  raise ArgumentError, "XmlMarkup cannot mix a text argument with a block"
	end
	_capture_outer_self(block) if @self.nil?
	_indent
	_start_tag(sym, attrs)
	_newline
	_nested_structures(block)
	_indent
	_end_tag(sym)
	_newline
      elsif text.nil?
	_indent
	_start_tag(sym, attrs, true)
	_newline
      else
	_indent
	_start_tag(sym, attrs)
	text! text
	_end_tag(sym)
	_newline
      end
      @target
    end

    # Append text to the output target.  Escape any markup.  May be
    # used within the markup brakets as:
    #
    #   builder.p { |b| b.br; b.text! "HI" }   #=>  <p><br/>HI</p>
    def text!(text)
      _text(_escape(text))
    end
    
    # Append text to the output target without escaping any markup.
    # May be used within the markup brakets as:
    #
    #   builder.p { |x| x << "<br/>HI" }   #=>  <p><br/>HI</p>
    #
    # This is useful when using non-builder enabled software that
    # generates strings.  Just insert the string directly into the
    # builder without changing the inserted markup.
    #
    # It is also useful for stacking builder objects.  Builders only
    # use <tt><<</tt> to append to the target, so by supporting this
    # method/operation builders can use other builders as their
    # targets.
    def <<(text)
      _text(text)
    end
    
    # For some reason, nil? is sent to the XmlMarkup object.  If nil?
    # is not defined and method_missing is invoked, some strange kind
    # of recursion happens.  Since nil? won't ever be an XML tag, it
    # is pretty safe to define it here. (Note: this is an example of
    # cargo cult programming,
    # cf. http://fishbowl.pastiche.org/2004/10/13/cargo_cult_programming).
    def nil?
      false
    end

    private
    
    def _escape(text)
      text.
	gsub(%r{&}, '&amp;').
	gsub(%r{<}, '&lt;').
	gsub(%r{>}, '&gt;')
    end

    def _capture_outer_self(block)
      @self = eval("self", block)
    end
    
    def _newline
      return if @indent == 0
      text! "\n"
    end
    
    def _indent
      return if @indent == 0 || @level == 0
      text!(" " * (@level * @indent))
    end
    
    def _nested_structures(block)
      @level += 1
      block.call(self)
    ensure
      @level -= 1
    end
  end
end

# xmlmarkup.rb
module Builder

  # Create XML markup easily.  All (well, almost all) methods sent to
  # an XmlMarkup object will be translated to the equivalent XML
  # markup.  Any method with a block will be treated as an XML markup
  # tag with nested markup in the block.
  #
  # Examples will demonstrate this easier than words.  In the
  # following, +xm+ is an +XmlMarkup+ object.
  #
  #   xm.em("emphasized")             # => <em>emphasized</em>
  #   xm.em { xmm.b("emp & bold") }   # => <em><b>emph &amp; bold</b></em>
  #   xm.a("A Link", "href"=>"http://onestepback.org")
  #                                   # => <a href="http://onestepback.org">A Link</a>
  #   xm.div { br }                    # => <div><br/></div>
  #   xm.target("name"=>"compile", "option"=>"fast")
  #                                   # => <target option="fast" name="compile"\>
  #                                   # NOTE: order of attributes is not specified.
  #
  #   xm.instruct!                   # <?xml version="1.0" encoding="UTF-8"?>
  #   xm.html {                      # <html>
  #     xm.head {                    #   <head>
  #       xm.title("History")        #     <title>History</title>
  #     }                            #   </head>
  #     xm.body {                    #   <body>
  #       xm.comment! "HI"           #     <!-- HI -->
  #       xm.h1("Header")            #     <h1>Header</h1>
  #       xm.p("paragraph")          #     <p>paragraph</p>
  #     }                            #   </body>
  #   }                              # </html>
  #
  # == Notes:
  #
  # * The order that attributes are inserted in markup tags is
  #   undefined. 
  #
  # * Sometimes you wish to insert text without enclosing tags.  Use
  #   the <tt>text!</tt> method to accomplish this.
  #
  #   Example:
  #
  #     xm.div {                          # <div>
  #       xm.text! "line"; xm.br          #   line<br/>
  #       xm.text! "another line"; xmbr   #    another line<br/>
  #     }                                 # </div>
  #
  # * The special XML characters <, >, and & are converted to &lt;,
  #   &gt; and &amp; automatically.  Use the <tt><<</tt> operation to
  #   insert text without modification.
  #
  # * Sometimes tags use special characters not allowed in ruby
  #   identifiers.  Use the <tt>tag!</tt> method to handle these
  #   cases.
  #
  #   Example:
  #
  #     xml.tag!("SOAP:Envelope") { ... }
  #
  #   will produce ...
  #
  #     <SOAP:Envelope> ... </SOAP:Envelope>"
  #
  #   <tt>tag!</tt> will also take text and attribute arguments (after
  #   the tag name) like normal markup methods.  (But see the next
  #   bullet item for a better way to handle XML namespaces).
  #   
  # * Direct support for XML namespaces is now available.  If the
  #   first argument to a tag call is a symbol, it will be joined to
  #   the tag to produce a namespace:tag combination.  It is easier to
  #   show this than describe it.
  #
  #     xml.SOAP :Envelope do ... end
  #
  #   Just put a space before the colon in a namespace to produce the
  #   right form for builder (e.g. "<tt>SOAP:Envelope</tt>" =>
  #   "<tt>xml.SOAP :Envelope</tt>")
  #
  # * XmlMarkup builds the markup in any object (called a _target_)
  #   that accepts the <tt><<</tt> method.  If no target is given,
  #   then XmlMarkup defaults to a string target.
  # 
  #   Examples:
  #
  #     xm = Builder::XmlMarkup.new
  #     result = xm.title("yada")
  #     # result is a string containing the markup.
  #
  #     buffer = ""
  #     xm = Builder::XmlMarkup.new(buffer)
  #     # The markup is appended to buffer (using <<)
  #
  #     xm = Builder::XmlMarkup.new(STDOUT)
  #     # The markup is written to STDOUT (using <<)
  #
  #     xm = Builder::XmlMarkup.new
  #     x2 = Builder::XmlMarkup.new(:target=>xm)
  #     # Markup written to +x2+ will be send to +xm+.
  #   
  # * Indentation is enabled by providing the number of spaces to
  #   indent for each level as a second argument to XmlBuilder.new.
  #   Initial indentation may be specified using a third parameter.
  #
  #   Example:
  #
  #     xm = Builder.new(:ident=>2)
  #     # xm will produce nicely formatted and indented XML.
  #  
  #     xm = Builder.new(:indent=>2, :margin=>4)
  #     # xm will produce nicely formatted and indented XML with 2
  #     # spaces per indent and an over all indentation level of 4.
  #
  #     builder = Builder::XmlMarkup.new(:target=>$stdout, :indent=>2)
  #     builder.name { |b| b.first("Jim"); b.last("Weirich) }
  #     # prints:
  #     #     <name>
  #     #       <first>Jim</first>
  #     #       <last>Weirich</last>
  #     #     </name>
  #
  # * The instance_eval implementation which forces self to refer to
  #   the message receiver as self is now obsolete.  We now use normal
  #   block calls to execute the markup block.  This means that all
  #   markup methods must now be explicitly send to the xml builder.
  #   For instance, instead of
  #
  #      xml.div { strong("text") }
  #
  #   you need to write:
  #
  #      xml.div { xml.strong("text") }
  #
  #   Although more verbose, the subtle change in semantics within the
  #   block was found to be prone to error.  To make this change a
  #   little less cumbersome, the markup block now gets the markup
  #   object sent as an argument, allowing you to use a shorter alias
  #   within the block.
  #
  #   For example:
  #
  #     xml_builder = Builder::XmlMarkup.new
  #     xml_builder.div { |xml|
  #       xml.stong("text")
  #     }
  #
  class XmlMarkup < XmlBase

    # Create an XML markup builder.  Parameters are specified by an
    # option hash.
    #
    # :target=><em>target_object</em>::
    #    Object receiving the markup.  +out+ must respond to the
    #    <tt><<</tt> operator.  The default is a plain string target.
    # :indent=><em>indentation</em>::
    #    Number of spaces used for indentation.  The default is no
    #    indentation and no line breaks.
    # :margin=><em>initial_indentation_level</em>::
    #    Amount of initial indentation (specified in levels, not
    #    spaces).
    #    
    def initialize(options={})
      indent = options[:indent] || 0
      margin = options[:margin] || 0
      super(indent, margin)
      @target = options[:target] || ""
    end
    
    # Return the target of the builder.
    def target!
      @target
    end

    def comment!(comment_text)
      _ensure_no_block block_given?
      _special("<!-- ", " -->", comment_text, nil)
    end

    # Insert an XML declaration into the XML markup.
    #
    # For example:
    #
    #   xml.declare! :ELEMENT, :blah, "yada"
    #       # => <!ELEMENT blah "yada">
    def declare!(inst, *args, &block)
      _indent
      @target << "<!#{inst}"
      args.each do |arg|
	case arg
	when String
	  @target << %{ "#{arg}"}
	when Symbol
	  @target << " #{arg}"
	end
      end
      if block_given?
	@target << " ["
	_newline
	_nested_structures(block)
	@target << "]"
      end
      @target << ">"
      _newline
    end

    # Insert a processing instruction into the XML markup.  E.g.
    #
    # For example:
    #
    #    xml.instruct!
    #        #=> <?xml version="1.0" encoding="UTF-8"?>
    #    xml.instruct! :aaa, :bbb=>"ccc"
    #        #=> <?aaa bbb="ccc"?>
    #
    def instruct!(directive_tag=:xml, attrs={})
      _ensure_no_block block_given?
      if directive_tag == :xml
	a = { :version=>"1.0", :encoding=>"UTF-8" }
	attrs = a.dup.update attrs  # was merge, which isn't available with ruby 1.6.8
      end
      _special(
	"<?#{directive_tag}",
	"?>",
	nil,
	attrs,
	[:version, :encoding, :standalone])
    end

    private

    # NOTE: All private methods of a builder object are prefixed when
    # a "_" character to avoid possible conflict with XML tag names.

    # Insert text directly in to the builder's target.
    def _text(text)
      @target << text
    end
    
    # Insert special instruction. 
    def _special(open, close, data=nil, attrs=nil, order=[])
      _indent
      @target << open
      @target << data if data
      _insert_attributes(attrs, order) if attrs
      @target << close
      _newline
    end

    # Start an XML tag.  If <tt>end_too</tt> is true, then the start
    # tag is also the end tag (e.g.  <br/>
    def _start_tag(sym, attrs, end_too=false)
      @target << "<#{sym}"
      _insert_attributes(attrs)
      @target << "/" if end_too
      @target << ">"
    end
    
    # Insert an ending tag.
    def _end_tag(sym)
      @target << "</#{sym}>"
    end

    # Insert the attributes (given in the hash).
    def _insert_attributes(attrs, order=[])
      return if attrs.nil?
      order.each do |k|
	v = attrs[k]
	@target << %{ #{k}="#{v}"} if v
      end
      attrs.each do |k, v|
	@target << %{ #{k}="#{v}"} unless order.member?(k)
      end
    end

    def _ensure_no_block(got_block)
      if got_block
	fail IllegalBlockError,
	  "Blocks are not allowed on XML instructions"
      end
    end

  end

end

