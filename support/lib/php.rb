class PHPFunction
  def initialize(prototype)
    @parts = prototype.strip.match(/^\s*(?:([0-9A-Za-z|_]+)\s+)?(\w+)\s*\((.*)\).*$/)
  end
  
  def params
    params = @parts[3] rescue ''

    params.scan(/(?:\[\s*)?(\w+ )?(&?\$?[\w.|]+)(?:\s*=\s*(.+))?(\])?,?/).map do |(type, name, default, optional_bracket)|
      param = type.to_s + name
      optional = false
      if optional_bracket
        # Optional
        param = '[' + param + ']'
        optional = true
      elsif default
        # Optional with default
        param = '[' + param + ' = ' + default + ']'
        optional = true
      end
      {
        :param => param,
        :type => type.to_s.strip,
        :name => name.to_s,
        :optional => optional,
        :default => default
      }
    end
  end
  
  def name
    @parts[2]
  end
  
  def type
    @parts[1]
  end
end
