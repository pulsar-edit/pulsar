require "#{ENV["TM_SUPPORT_PATH"]}/lib/scriptmate"

class PhpScript < UserScript
  def lang; "Php" end
  # Disable display_errors so that errors are printed to stderr only
  # Enabling log_errors (without an error_log) sends errors to stdout
  def default_extension; ".php" end
  def args
    ['-d display_errors=0', '-d log_errors=1', '-d error_log=']
  end
  def filter_cmd(cmd)
    # PHP doesn't understand - to mean stdin :(
    cmd[cmd.size - 1] = '--' if cmd.last == '-'
    cmd
  end
  def executable; @hashbang || ENV['TM_PHP'] || 'php' end
  def version_string
    path = ENV['PATH'].split(':').find { |e| File.exists? File.join(e, executable) }
    php_path = File.join(path.to_s, executable)
    res = %x{ #{executable} -v }.split[0..2].join %{ }
    res + " (#{php_path})"
  end
end

class PhpMate < ScriptMate
  def filter_stderr(str)
    # strings from stderr are passed through this method before printing
    super(str).
    gsub(/(#\d+ )((.+?)\((\d+)\)): /) {
      $1 + '<a href="txmt://open?' + (ENV.has_key?('TM_FILEPATH') ? "url=file://#{$3}&amp;" : '') + 'line=' + $4 + '"> ' + $2 + '</a>: '
    }.
    gsub(/in (.+?) on line (\d+)(<br>$)?/) {
      'in <a href="txmt://open?' + (ENV.has_key?('TM_FILEPATH') ? "url=file://#{$1}&amp;" : '') + 'line=' + $2 + '"> ' + $1 + ' on line ' + $2 + '</a>' + $3.to_s
    }
  end

  def filter_stdout(str)
    # strings from stderr are passed through this method before printing
    super(str).gsub(/\[([^\]]+?) line (\d+)\]<br>$/) {
      '[<a href="txmt://open?' + (ENV.has_key?('TM_FILEPATH') ? "url=file://#{$1}&amp;" : '') + 'line=' + $2 + '">' + $1 + ' line ' + $2 + '</a>]<br>'
    }
  end
end

script = PhpScript.new(STDIN.read)
PhpMate.new(script).emit_html
