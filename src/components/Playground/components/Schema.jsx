import './Schema.css';

function generateSchema(data) {
  if (data === null) return { type: 'null' };
  if (Array.isArray(data)) {
    return { type: 'array', items: data.length > 0 ? generateSchema(data[0]) : {} };
  }
  if (typeof data === 'object') {
    const properties = {};
    const required = [];
    Object.entries(data).forEach(([key, value]) => {
      properties[key] = generateSchema(value);
      required.push(key);
    });
    return { type: 'object', properties, required };
  }
  return { type: typeof data };
}

function Schema({ data }) {
  if (!data) {
    return <div className="schema__empty">Parse valid JSON to generate schema</div>;
  }

  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    ...generateSchema(data),
  };

  return (
    <div className="schema">
      <pre className="schema__code">{JSON.stringify(schema, null, 2)}</pre>
    </div>
  );
}

export default Schema;
